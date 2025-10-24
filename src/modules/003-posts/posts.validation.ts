import z from "zod";
import { AllowCommentsEnum, AvailabilityEnum } from "../../DataBase/models/post.model";
import { generalFields } from "../../middlewares/validation.middleware";
import { fileValidation } from "../../utils/multer/cloud.,multer";

export const createPost = {
    body: z.strictObject({
        content: z.string().min(2).max(50000).optional(),

        attachments: z.array(generalFields.file(fileValidation.image)).max(2).optional(),

        availability: z.enum(AvailabilityEnum).default(AvailabilityEnum.public),

        allowCommentsEnum: z.enum(AllowCommentsEnum).default(AllowCommentsEnum.allow),

        tags: z.array(generalFields.id).max(10).optional()

    }).superRefine((data, context) => {

        if (!data.attachments?.length && !data.content) {
            context.addIssue({
                code: "custom",
                path: ["content"],
                message: "Cannot Make Post Without Content Or Attacments"
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

export const updatePost = {


    params: z.strictObject({
        postId: generalFields.id,
    }),

    body: z.strictObject({

        content: z.string().min(2).max(50000).optional(),


        attachments: z.array(generalFields.file(fileValidation.image)).max(2).optional(),
        removedAttachments: z.array(z.string()).max(2).optional(),


        availability: z.enum(AvailabilityEnum).optional(),

        allowCommentsEnum: z.enum(AllowCommentsEnum).optional(),

        tags: z.array(generalFields.id).max(10).optional(),
        removedTags: z.array(generalFields.id).max(10).optional()


    }).superRefine((data, context) => {

        if (!Object.values(data)?.length) {
            context.addIssue({
                code: "custom",
                message: "All Fields Are Empty"
            })

        }

        if (data.tags?.length && data.tags.length !== [...new Set(data.tags)].length) {
            context.addIssue({
                code: "custom",
                path: ["tags"],
                message: "Duplicated Tagged Users"
            })
        }

        if (data.removedTags?.length && data.removedTags.length !== [...new Set(data.removedTags)].length) {
            context.addIssue({
                code: "custom",
                path: ["removedTags"],
                message: "Duplicated Removed Tagged Users"
            })
        }

    })
}

export const getPost = {
    params: z.strictObject({
        postId: generalFields.id
    })
}

export const getPosts = {
    query: z.strictObject({
        page: z.coerce.number().positive().min(1).max(10).optional(),
        limit : z.coerce.number().positive().min(1).max(50).optional()
    })
}

export const likePost = {
    params: getPost.params.extend({})
}

export const deletePost = {
    params: getPost.params.extend({})
}


export const GQLValidation = {

    allPosts: z.strictObject({
        page: z.coerce.number().positive().min(1).max(10).optional(),
        limit: z.coerce.number().positive().min(1).max(50).optional()
    }),

    searchForPost: z.strictObject({
        key: z.string(),
        page: z.coerce.number().positive().min(1).max(10).optional(),
        limit: z.coerce.number().positive().min(1).max(50).optional()
    }),
}
