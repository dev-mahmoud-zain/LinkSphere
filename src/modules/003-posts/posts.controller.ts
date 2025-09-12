import { Router } from "express";
import { PostService } from "./posts.srevice";
import { authenticationMiddeware } from "../../middlewares/authentication.middleware";
import { cloudFileUpload, fileValidation, StorageEnum } from "../../utils/multer/cloud.,multer";
import { validationMiddleware } from "../../middlewares/validation.middleware";
import *  as  validation from "./posts.validation";

const postService = new PostService();

const router = Router();

router.post("/create-post",
    authenticationMiddeware(),
    cloudFileUpload({ validation: fileValidation.image, storageApproach: StorageEnum.disk }).array("attachments", 2),
    validationMiddleware(validation.createPost),
    postService.createPotst);

router.get("/{:postId}",
    // authenticationMiddeware(), مؤقتاً بس عشان نشوفها من الميل
    validationMiddleware(validation.getPost),
    postService.getPost);

router.post("/like/{:postId}",
    authenticationMiddeware(), 
    validationMiddleware(validation.likePost),
    postService.likePost);

export default router;