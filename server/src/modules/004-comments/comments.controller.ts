import { Router } from "express";
import { Comments } from "./comments.service";
import { validationMiddleware } from "../../middlewares/validation.middleware";
import * as validation from "./comments.validation";
import { cloudFileUpload, fileValidation, StorageEnum } from "../../utils/multer/cloud.,multer";
import { authenticationMiddeware } from "../../middlewares/authentication.middleware";

const router = Router({ mergeParams: true });
const comments = new Comments();


router.post("/comment",
    authenticationMiddeware(),
    cloudFileUpload({
        validation: fileValidation.image,
        storageApproach: StorageEnum.disk
    }).single("image"),
    validationMiddleware(validation.createComment),
    comments.createComment);


router.post("/:commentId/reply",
    authenticationMiddeware(),
    cloudFileUpload({
        validation: fileValidation.image,
        storageApproach: StorageEnum.disk
    }).single("image"),
    validationMiddleware(validation.replyOnComment),
    comments.replyOnComment);

export default router;