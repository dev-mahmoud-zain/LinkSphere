import z from "zod"
import { generalFields } from "../../middlewares/validation.middleware"
import { fileValidation } from "../../utils/multer/cloud.,multer"

export const createComment = {

    params: z.strictObject({
        postId: generalFields.id
    }),

    body: z.strictObject({

        content: z.string().min(2).max(50000).optional(),
        attachment: generalFields.file(fileValidation.image).optional(),
        tags: z.array(generalFields.id).max(10).optional()

    }).superRefine((data, context) => {

        if (!data.attachment && !data.content) {
            context.addIssue({
                code: "custom",
                path: ["content"],
                message: "Cannot Make Post Without Content Or image"
            })
        }

        if (data.tags?.length && data.tags.length !== [...new Set(data.tags)].length) {
            context.addIssue({
                code: "custom",
                path: ["tags"],
                message: "Duplicated Tagged Users"
            })
        }

    })

}

export const replyOnComment = {

    params: createComment.params.extend({
        commentId: generalFields.id
    }),
    body: createComment.body.extend({})
}