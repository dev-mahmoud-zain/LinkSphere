import z from "zod";
import *  as  validators from "../004-comments/comments.validation";


export type I_CreateCommentInputs = z.infer<typeof validators.createComment.body>
export type I_UpdateCommentInputs = z.infer<typeof validators.updateComment.body>
export type I_ReplyOnCommentInputs = z.infer<typeof validators.replyOnComment.body>