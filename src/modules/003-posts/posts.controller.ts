import { Router } from "express";
import { PostService } from "./posts.service";
import {
  authenticationMiddleware,
} from "../../middlewares/authentication.middleware";
import {
  cloudFileUpload,
  fileValidation,
  StorageEnum,
} from "../../utils/multer/cloud.,multer";
import { validationMiddleware } from "../../middlewares/validation.middleware";
import * as validation from "./posts.validation";
import { router as commentsRouter } from "../004-comments/index";

const postService = new PostService();

const router = Router();

router.use("/:postId/", commentsRouter);

router.post(
  "/create-post",
  authenticationMiddleware(),
  cloudFileUpload({
    validation: fileValidation.image,
    storageApproach: StorageEnum.memory,
  }).array("attachments", 5),
  validationMiddleware(validation.createPost),
  postService.createPost
);

router.patch(
  "/update-content/{:postId}",
  authenticationMiddleware(),
  validationMiddleware(validation.updatePostContent),
  postService.updatePostContent
);

router.patch(
  "/update-attachments/{:postId}",
  authenticationMiddleware(),
  cloudFileUpload({
    validation: fileValidation.image,
    storageApproach: StorageEnum.memory,
  }).array("addToAttachments", 5),
  validationMiddleware(validation.updatePostAttachments),
  postService.updatePostAttachments
);

router.get(
  "/",
  authenticationMiddleware(),
  validationMiddleware(validation.getPosts),
  postService.getPosts
);

router.get(
  "/:postId/liked-users",
  authenticationMiddleware(),
  validationMiddleware(validation.getLikedUsers),
  postService.getLikedUsers
);


router.get(
  "/search",
  authenticationMiddleware(),
  validationMiddleware(validation.searchForPost),
  postService.searchPosts
);

router.get("/me", authenticationMiddleware(),validationMiddleware(validation.getPosts), postService.getMyPosts);

router.get(
  "/user/:userId",
  authenticationMiddleware(),
  postService.getUserPosts
);

router.get("/freezed", authenticationMiddleware(), postService.getFreezedPosts);

router.get(
  "/{:postId}",
  authenticationMiddleware(),
  validationMiddleware(validation.getPost),
  postService.getPost
);

router.post(
  "/like/:postId",
  authenticationMiddleware(),
  validationMiddleware(validation.likePost),
  postService.likePost
);

router.delete(
  "/freeze/:postId",
  authenticationMiddleware(),
  validationMiddleware(validation.deletePost),
  postService.freezePost
);

router.patch(
  "/unfreeze/:postId",
  authenticationMiddleware(),
  validationMiddleware(validation.deletePost),
  postService.unfreezePost
);

router.delete(
  "/:postId",
  authenticationMiddleware(),
  validationMiddleware(validation.deletePost),
  postService.deletePost
);

export default router;
