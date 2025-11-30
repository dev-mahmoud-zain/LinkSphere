import z from "zod";
import { generalFields } from "../../middlewares/validation.middleware";

export const getChat = {
    params:z.strictObject({
        userId:generalFields.id
    }),
    query:z.strictObject({
            page: z.coerce.number().positive().min(1).max(10).optional(),
            limit: z.coerce.number().positive().min(1).max(50).optional(),
    })
}