import z from "zod";
import { generalFields } from "../../middlewares/validation.middleware";

export const getChat = {
    params:z.strictObject({
        userId:generalFields.id
    })
}