import z from "zod";
import { generalFields } from "../../middlewares/validation.middleware";

export const freezAccount = {
    params: z.object({
        userId: generalFields.id.optional()
    })
}

export const deleteAccount = {
    params: z.object({
        userId: generalFields.id
    })
}