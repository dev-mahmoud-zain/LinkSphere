import type { NextFunction, Request, Response } from "express"
import { z, type ZodError, type ZodType } from "zod";
import { BadRequestException } from "../utils/response/error.response";
import mongoose from "mongoose";
import { GenderEnum } from "../DataBase/models/user.model";
import { GraphQLError } from "graphql";


type KeyReqType = keyof Request;
type SchimaType = Partial<Record<KeyReqType, ZodType>>;
type validationErrorsType = Array<{
    key: KeyReqType,
    issues: Array<{
        path: (string | number | symbol | undefined)[],
        message: string
    }>;
}>



export const validationMiddleware = (schima: SchimaType) => {
    return (req: Request, res: Response, next: NextFunction): NextFunction => {

        const validationErrors: validationErrorsType = [];

        for (const key of Object.keys(schima) as KeyReqType[]) {

            if (!schima[key]) continue;

            if (req.file) {
                req.body.attachment = req.file;
            }

            if (req.files) {
                req.body.attachments = req.files;
            }

            const validationResult = schima[key].safeParse(req[key]);

            if (!validationResult.success) {
                const errors = validationResult.error as ZodError;

                validationErrors.push({
                    key,
                    issues: errors.issues.map(issue => {
                        return {
                            path: issue.path,
                            message: issue.message
                        }
                    })
                })

            }

            if (validationResult.data) {
                req[key].validData = validationResult.data
            }

        }

        if (validationErrors.length) {
            throw new BadRequestException("Validation Error", { validationErrors })
        }

        return next() as unknown as NextFunction
    }
}

export const graphQLValidationMiddleware = async <T = any>(schima: ZodType, args: T) => {
    const validationResult = await schima.safeParseAsync(args);
    if (validationResult.error) {
        const ZError = validationResult.error as ZodError;

        throw new GraphQLError("Validation Error",{
            extensions:{
                statusCode :400,
                issues:{
                    key:"args",
                    issues :ZError.issues.map((issue)=>{
                        return {
                            path :issue.path,
                            message: issue.message
                        }
                    })
                }
            }
        })
    }
}

export const generalFields = {
    userName: z
        .string()
        .min(3, { message: "userName min length is 3 letters" })
        .max(30, { message: "userName max length is 30 letters" })
        .refine(
            (val) => {
                const parts = val.trim().split(/\s+/);
                return parts.length === 2;
            },
            { message: "userName must consist of two words (Firstname Lastname)" }
        ),
    email: z.email(),
    password: z.string({ error: "password Must Be String" })
        .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
            { error: "Password should be 8+ chars with uppercase, lowercase, number, and special character." }),
    phone: z.string().regex(/^(?:01[0125]\d{8}|(?:\+20|0020)1[0125]\d{8})$/),
    gender: z.enum(GenderEnum),
    OTP: z.string().regex(/^\d{6}$/, { message: "OTP must be exactly 6 digits" }),
    token: z.string().regex(/^(Bearer|System)\s?[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
        "Invalid token format: token must start with 'Bearer' or 'System', followed by a space and a valid JWT"
    ),
    id: z.string()
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
            message: "Invalid ObjectId Format",
        }),

    file: function (mimetype: string[]) {

        return z.object({
            fieldname: z.string(),
            originalname: z.string(),
            encoding: z.string(),
            mimetype: z.enum(mimetype),
            buffer: z.any().optional(),
            path: z.any().optional(),
            size: z.number()
        }).refine((data) => {
            return data.buffer || data.path;
        }, { error: "Neither Path Or Buffer Is Avalibale", path: ["file"] })

    }
}