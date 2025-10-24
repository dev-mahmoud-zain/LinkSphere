import { Router } from "express";
import { authenticationMiddleware } from "../../middlewares/authentication.middleware";
import { validationMiddleware } from "../../middlewares/validation.middleware";
import { validation } from "./index"
import { ChatService } from "./index";
import { cloudFileUpload, fileValidation, StorageEnum } from "../../utils/multer/cloud.,multer";

const router = Router({ mergeParams: true });
const chatService = new ChatService();


router.get("/", authenticationMiddleware()
    , validationMiddleware(validation.getChat), chatService.getChat);

router.get("/group/:groupId", authenticationMiddleware()
    , validationMiddleware(validation.getGroupChat), chatService.getGroupChat);


router.post("/create-chatting-group", authenticationMiddleware(),
    cloudFileUpload({ validation: fileValidation.image, storageApproach: StorageEnum.memory }).single("attachment")
    , validationMiddleware(validation.createChattingGroup)
    , chatService.createChattingGroup);

export default router;