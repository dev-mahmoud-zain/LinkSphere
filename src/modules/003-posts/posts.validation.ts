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

        if(data.tags?.length && data.tags.length !== [...new Set(data.tags)].length){
            context.addIssue({
                code:"custom",
                path:["tags"],
                message:"Duplicated Tagged Users"
            })
        }

    })
}


export const getPost = {
    params: z.strictObject({
        postId:generalFields.id
    })
}


export const likePost = {
    params: getPost.params.extend({})
}