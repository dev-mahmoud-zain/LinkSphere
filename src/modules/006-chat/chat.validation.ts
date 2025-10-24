import z from "zod";
import { generalFields } from "../../middlewares/validation.middleware";
import { fileValidation } from "../../utils/multer/cloud.,multer";

export const sendMessage = {
    params: z.strictObject({
        userId: generalFields.id
    }),

}

export const getChat = {
    params: sendMessage.params.extend({}),
    query: z.strictObject({
        page: z.coerce.number().int().min(1).optional(),
        size: z.coerce.number().int().min(2).optional(),
    })
}



export const getGroupChat = {
    params: z.strictObject({
        groupId: generalFields.id,
    }),

    query:getChat.query.extend({})
}


export const createChattingGroup = {

    body: z.strictObject({
        groupName: z.string().min(2).max(255),
        participants: z.array(generalFields.id).min(2).max(200),
        attachment: generalFields.file(fileValidation.image).optional()
    }).superRefine((data, ctx) => {

        if (data.participants.length &&
            data.participants.length !== [...new Set(data.participants)].length
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["participants"],
                message: "Some OF Participants Are Duplicated"
            })
        }

    })

}