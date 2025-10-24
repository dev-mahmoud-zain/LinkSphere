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
                message: "Cannot Make Comment Without Content Or image"
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


export const updateComment = {

    params: z.strictObject({
        postId: generalFields.id,
        commentId: generalFields.id
    }),

    body: z.strictObject({

        content: z.string().min(2).max(50000).optional(),
        attachment: generalFields.file(fileValidation.image).optional(),
        tags: z.array(generalFields.id).max(10).optional(),
        removeAttachment: z.string().optional()

    }).superRefine((data, context) => {

        if (!data) {
            context.addIssue({
                code: "custom",
                path: ["content"],
                message: "Cannot Update Comment Without Any Updated Data"
            })
        }

        if (data.tags?.length && data.tags.length !== [...new Set(data.tags)].length) {
            context.addIssue({
                code: "custom",
                path: ["tags"],
                message: "Duplicated Tagged Users"
            })
        }


        if (data.attachment && data.removeAttachment) {
            context.addIssue({
                code: "custom",
                path: ["attachment"],
                message: "Cannot Send attachment with removeAttachment"
            })
        }

    })

}


export const deleteComment = {
    params: createComment.params.extend({
        commentId: generalFields.id
    }),
}

export const getComment = {
    params: z.strictObject({
        postId: generalFields.id,
        commentId: generalFields.id
    })
}

export const replyOnComment = {
    params: deleteComment.params.extend({}),
    body: createComment.body.extend({})
}


export const getPostComments = {
    query: z.strictObject({
        page: z.coerce.number().positive().min(1).max(10).optional(),
        limit : z.coerce.number().positive().min(1).max(50).optional()
    })
}


export const getCommentReplies= {
    query: getPostComments.query.extend({})
}