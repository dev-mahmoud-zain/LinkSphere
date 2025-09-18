"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalFields = exports.validationMiddleware = void 0;
const zod_1 = require("zod");
const error_response_1 = require("../utils/response/error.response");
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("../DataBase/models/user.model");
const validationMiddleware = (schima) => {
    return (req, res, next) => {
        const validationErrors = [];
        for (const key of Object.keys(schima)) {
            if (!schima[key])
                continue;
            if (req.file) {
                req.body.attachment = req.file;
            }
            if (req.files) {
                req.body.attachments = req.files;
            }
            const validationResult = schima[key].safeParse(req[key]);
            if (!validationResult.success) {
                const errors = validationResult.error;
                validationErrors.push({
                    key,
                    issues: errors.issues.map(issue => {
                        return {
                            path: issue.path,
                            message: issue.message
                        };
                    })
                });
            }
            if (validationResult.data) {
                req[key].validData = validationResult.data;
            }
        }
        if (validationErrors.length) {
            throw new error_response_1.BadRequestException("Validation Error", { validationErrors });
        }
        return next();
    };
};
exports.validationMiddleware = validationMiddleware;
exports.generalFields = {
    userName: zod_1.z
        .string()
        .min(3, { message: "userName min length is 3 letters" })
        .max(30, { message: "userName max length is 30 letters" })
        .refine((val) => {
        const parts = val.trim().split(/\s+/);
        return parts.length === 2;
    }, { message: "userName must consist of two words (Firstname Lastname)" }),
    email: zod_1.z.email(),
    password: zod_1.z.string({ error: "password Must Be String" })
        .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/, { error: "Password should be 8+ chars with uppercase, lowercase, number, and special character." }),
    phone: zod_1.z.string().regex(/^(?:01[0125]\d{8}|(?:\+20|0020)1[0125]\d{8})$/),
    gender: zod_1.z.enum(user_model_1.GenderEnum),
    OTP: zod_1.z.string().regex(/^\d{6}$/, { message: "OTP must be exactly 6 digits" }),
    token: zod_1.z.string().regex(/^(Bearer|System)\s?[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/, "Invalid token format: token must start with 'Bearer' or 'System', followed by a space and a valid JWT"),
    id: zod_1.z.string()
        .refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: "Invalid ObjectId Format",
    }),
    file: function (mimetype) {
        return zod_1.z.object({
            fieldname: zod_1.z.string(),
            originalname: zod_1.z.string(),
            encoding: zod_1.z.string(),
            mimetype: zod_1.z.enum(mimetype),
            buffer: zod_1.z.any().optional(),
            path: zod_1.z.any().optional(),
            size: zod_1.z.number()
        }).refine((data) => {
            return data.buffer || data.path;
        }, { error: "Neither Path Or Buffer Is Avalibale", path: ["file"] });
    }
};
