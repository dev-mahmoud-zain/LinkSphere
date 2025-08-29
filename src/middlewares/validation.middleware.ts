import type { NextFunction, Request, Response } from "express"
import { z, type ZodError, type ZodType } from "zod";
import { BadRequestException } from "../utils/response/error.response";


type KeyReqType = keyof Request;
type SchimaType = Partial<Record<KeyReqType, ZodType>>;
type validationErrorsType = Array<{
    key: KeyReqType,
    issues: Array<{
        path: string | number | symbol | undefined,
        message: string
    }>;
}>


export const validationMiddleware = (schima: SchimaType) => {
    return (req: Request, res: Response, next: NextFunction): NextFunction => {

        const validationErrors: validationErrorsType = [];

        for (const key of Object.keys(schima) as KeyReqType[]) {
            if (!schima[key]) continue;

            const validationResult = schima[key].safeParse(req[key]);

            if (!validationResult.success) {
                const errors = validationResult.error as ZodError;

                validationErrors.push({
                    key,
                    issues: errors.issues.map(issue => {
                        return {
                            path: issue.path[0],
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

export const generalFields = {
    userName: z.string({ error: "userName Must Be String" })
        .min(3, { error: "userName Min Lenght Is 3 Letters" })
        .max(30, { error: "userName Max Lenght Is 30 Letters" }),
    email: z.email(),
    password: z.string({ error: "password Must Be String" })
        .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
            { error: "Password should be 8+ chars with uppercase, lowercase, number, and special character." }),
    phone: z.string().regex(/^(?:01[0125]\d{8}|(?:\+20|0020)1[0125]\d{8})$/),
    OTP: z.string().regex(/^\d{6}$/, { message: "OTP must be exactly 6 digits" }),
    token: z.string().regex(/^(Bearer|System)\s?[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
        "Invalid token format: token must start with 'Bearer' or 'System', followed by a space and a valid JWT"
    )
}