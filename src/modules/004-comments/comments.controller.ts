import { Router } from "express";
import { Comments } from "./comments.service";
import { validationMiddleware } from "../../middlewares/validation.middleware";
import * as validation from "./comments.validation";
import { cloudFileUpload, fileValidation, StorageEnum } from "../../utils/multer/cloud.,multer";
import { authenticationMiddleware } from "../../middlewares/authentication.middleware";

const router = Router({ mergeParams: true });
const comments = new Comments();


router.post("/create-comment",
    authenticationMiddleware(),
    cloudFileUpload({
        validation: fileValidation.image,
        storageApproach: StorageEnum.disk
    }).single("image"),
    validationMiddleware(validation.createComment),
    comments.createComment);


router.get("/comment/:commentId",
    authenticationMiddleware(),
    validationMiddleware(validation.getComment),
    comments.getComment);

router.get("/comments/",
    authenticationMiddleware(),
    validationMiddleware(validation.getPostComments),
    comments.getPostComments);

router.get("/:commentId/replies",
    authenticationMiddleware(),
    validationMiddleware(validation.getCommentReplies),
    comments.getGetCommentReplies);

router.patch("/update/:commentId",
    authenticationMiddleware(),
    cloudFileUpload({
        validation: fileValidation.image,
        storageApproach: StorageEnum.disk
    }).single("image"),
    validationMiddleware(validation.updateComment),
    comments.updateComment);

router.post("/:commentId/create-reply",
    authenticationMiddleware(),
    cloudFileUpload({
        validation: fileValidation.image,
        storageApproach: StorageEnum.disk
    }).single("image"),
    validationMiddleware(validation.replyOnComment),
    comments.replyOnComment);

router.post("/:commentId/like",
    authenticationMiddleware(),
    comments.likeComment);

router.delete("/delete/:commentId",
    authenticationMiddleware(),
    validationMiddleware(validation.deleteComment),
    comments.deleteComment);


export default router;