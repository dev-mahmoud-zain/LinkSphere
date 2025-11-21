import z from "zod";
import {
  allowCommentsEnum,
  AvailabilityEnum,
} from "../../DataBase/models/post.model";
import { generalFields } from "../../middlewares/validation.middleware";
import { fileValidation } from "../../utils/multer/cloud.,multer";

export const createPost = {
  body: z
    .strictObject({
      content: z.string().min(2).max(50000).optional(),

      attachments: z
        .array(generalFields.file(fileValidation.image))
        .max(5)
        .optional(),

      availability: z.enum(AvailabilityEnum).default(AvailabilityEnum.public),

      allowCommentsEnum: z
        .enum(allowCommentsEnum)
        .default(allowCommentsEnum.allow),

      tags: z.array(generalFields.id).max(10).optional(),
    })
    .superRefine((data, context) => {
      if (!data.attachments?.length && !data.content) {
        context.addIssue({
          code: "custom",
          path: ["content"],
          message: "Cannot Make Post Without Content Or Attachments",
        });
      }

      if (
        data.tags?.length &&
        data.tags.length !== [...new Set(data.tags)].length
      ) {
        context.addIssue({
          code: "custom",
          path: ["tags"],
          message: "Duplicated Tagged Users",
        });
      }
    }),
};

// export const updatePost = {
//   params: z.strictObject({
//     postId: generalFields.id,
//   }),

//   body: z
//     .strictObject({
//       content: z.string().min(2).max(50000).optional(),

//       attachments: z
//         .array(generalFields.file(fileValidation.image))
//         .max(2)
//         .optional(),
//       removedAttachments: z.array(z.string()).max(2).optional(),

//       availability: z.enum(AvailabilityEnum).optional(),

//       allowCommentsEnum: z.enum(allowCommentsEnum).optional(),

//       tags: z.array(generalFields.id).max(10).optional(),
//       removedTags: z.array(generalFields.id).max(10).optional(),
//     })
//     .superRefine((data, context) => {
//       if (!Object.values(data)?.length) {
//         context.addIssue({
//           code: "custom",
//           message: "All Fields Are Empty",
//         });
//       }

//       if (
//         data.tags?.length &&
//         data.tags.length !== [...new Set(data.tags)].length
//       ) {
//         context.addIssue({
//           code: "custom",
//           path: ["tags"],
//           message: "Duplicated Tagged Users",
//         });
//       }

//       if (
//         data.removedTags?.length &&
//         data.removedTags.length !== [...new Set(data.removedTags)].length
//       ) {
//         context.addIssue({
//           code: "custom",
//           path: ["removedTags"],
//           message: "Duplicated Removed Tagged Users",
//         });
//       }
//     }),
// };

export const updatePostContent = {
  params: z.strictObject({
    postId: generalFields.id,
  }),

  body: z
    .strictObject({
      content: z.string().min(2).max(50000).optional(),

      availability: z.enum(AvailabilityEnum).optional(),

      allowComments: z.enum(allowCommentsEnum).optional(),

      addToTags: z.array(generalFields.id).max(10).optional(),

      removeFromTags: z.array(generalFields.id).max(10).optional(),
    })
    .superRefine((data, context) => {
      if (!Object.values(data)?.length) {
        context.addIssue({
          code: "custom",
          message: "All Fields Are Empty",
        });
      }

      if (
        data.addToTags?.length &&
        data.addToTags.length !== [...new Set(data.addToTags)].length
      ) {
        context.addIssue({
          code: "custom",
          path: ["addToTags"],
          message: "Duplicated Tagged Users",
        });
      }

      if (
        data.removeFromTags?.length &&
        data.removeFromTags.length !== [...new Set(data.removeFromTags)].length
      ) {
        context.addIssue({
          code: "custom",
          path: ["removeFromTags"],
          message: "Duplicated Removed Tagged Users",
        });
      }
    }),
};

export const updatePostAttachments = {
  params: updatePostContent.params.extend({}),
  body: z
    .strictObject({
      attachments: z
        .array(generalFields.file(fileValidation.image))
        .max(5)
        .optional(),

      removeFromAttachments: z.array(z.string()).optional(),
    })
    .superRefine((data, context) => {
      if (!Object.values(data)?.length) {
        context.addIssue({
          code: "custom",
          message: "All Fields Are Empty",
        });
      }

      if (
        data.removeFromAttachments?.length &&
        data.removeFromAttachments.length !==
          [...new Set(data.removeFromAttachments)].length
      ) {
        context.addIssue({
          code: "custom",
          path: ["attachments"],
          message: "Duplicated Removed Attachments Ids",
        });
      }
    }),
};

export const getPost = {
  params: z.strictObject({
    postId: generalFields.id,
  }),
};

export const getPosts = {
  query: z.strictObject({
    page: z.coerce.number().positive().min(1).max(10).optional(),
    limit: z.coerce.number().positive().min(1).max(50).optional(),
  }),
};

export const searchForPost = {
  query: z
    .strictObject({
      key: z.string().nonempty().optional(),
      author: z.string().nonempty().optional(),
      page: z.coerce.number().positive().min(1).max(10).optional(),
      limit: z.coerce.number().positive().min(1).max(50).optional(),
    })
    .superRefine((data, context) => {
      if (!data.key && !data.author) {
        context.addIssue({
          code: "custom",
          path: ["content"],
          message: "You must provide either a search keyword or an author name",
        });
      }
    }),
};

export const likePost = {
  params: getPost.params.extend({}),
};

export const deletePost = {
  params: getPost.params.extend({}),
};

export const GQLValidation = {
  allPosts: z.strictObject({
    page: z.coerce.number().positive().min(1).max(10).optional(),
    limit: z.coerce.number().positive().min(1).max(50).optional(),
  }),

  searchForPost: z.strictObject({
    key: z.string(),
    page: z.coerce.number().positive().min(1).max(10).optional(),
    limit: z.coerce.number().positive().min(1).max(50).optional(),
  }),
};
