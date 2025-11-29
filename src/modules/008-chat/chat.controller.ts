import {Router} from "express";
import { authenticationMiddleware } from "../../middlewares/authentication.middleware";
import { validationMiddleware } from "../../middlewares/validation.middleware";
import * as chatValidation from "./chat.validation";
import { ChatService } from "./chat.service";

const router = Router({ mergeParams: true });

const chatService = new ChatService()

// Get User Chat
router.get("/",
    authenticationMiddleware(),
    validationMiddleware(chatValidation.getChat),
    chatService.getChat
)



export default router;