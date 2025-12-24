import { Router } from "express";
import { authenticationMiddleware } from "../../middlewares/authentication.middleware";
import { validationMiddleware } from "../../middlewares/validation.middleware";
import * as chatValidation from "./chat.validation";
import { ChatService } from "./chat.service";

const router = Router({ mergeParams: true });

const chatService = new ChatService()

// Get Group Chat
router.get("/group/:chatId",
    authenticationMiddleware(),
    validationMiddleware(chatValidation.getGroupChat),
    chatService.getGroupChat
)

// Create Group Chat
router.post("/group",
    authenticationMiddleware(),
    validationMiddleware(chatValidation.createGroup),
    chatService.createGroup
)

// Get User Chat
router.get("/:userId",
    authenticationMiddleware(),
    validationMiddleware(chatValidation.getChat),
    chatService.getChat
)



export default router;