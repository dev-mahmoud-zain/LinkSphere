import { Router } from "express";
import usersService from "./users.service";
import { authenticationMiddleware, authorizationMiddleware } from "../../middlewares/authentication.middleware";
import { cloudFileUpload, fileValidation, StorageEnum } from "../../utils/multer/cloud.,multer";
import { validationMiddleware } from "../../middlewares/validation.middleware";
import * as usersValidation from "./users.validation";
import { endPoints } from "./users.authorization";
import { router as chatRouter } from "../006-chat"

const router = Router();
router.use("/:userId/chat", chatRouter)
// ============================ Profile Management =============================

router.get("/profile",
    authenticationMiddleware(),
    usersService.profile);

router.get("/:userId",
    authenticationMiddleware(),
    usersService.getUserById);

router.patch("/profile-picture",
    authenticationMiddleware(),
    cloudFileUpload({ validation: fileValidation.image, storageApproach: StorageEnum.memory }).single("image")
    , usersService.uploadProfilePicture);

router.patch("/profile-cover-images",
    authenticationMiddleware(),
    cloudFileUpload({ validation: fileValidation.image, storageApproach: StorageEnum.disk }).array("images", 2)
    , usersService.uploadCoverImages);

router.delete("/profile-picture",
    authenticationMiddleware(),
    usersService.deleteProfilePicture);

router.delete("/profile-cover-images",
    authenticationMiddleware(),
    usersService.deleteCoverImages);



// =========================  Friendship Management ============================


router.post("/friend-requst/:userId",
    authenticationMiddleware(),
    validationMiddleware(usersValidation.sendFriendRequst),
    usersService.sendFriendRequest);

router.patch("/accept-friend-requst/:requstId",
    authenticationMiddleware(),
    validationMiddleware(usersValidation.acceptFriendRequst),
    usersService.acceptFriendRequest);

router.delete("/cancel-friend-requst/:requstId",
    authenticationMiddleware(),
    validationMiddleware(usersValidation.cancelFriendRequst),
    usersService.cancelFriendRequest);

router.delete("/remove-friend/:userId",
    authenticationMiddleware(),
    validationMiddleware(usersValidation.removeFriend),
    usersService.removeFriend);


// ========================= User Information Updates ==========================

router.patch("/update-basic-info",
    authenticationMiddleware(),
    validationMiddleware(usersValidation.updateBasicInfo),
    usersService.updateBasicInfo);

router.patch("/update-email",
    authenticationMiddleware(),
    validationMiddleware(usersValidation.updateEmail),
    usersService.updateEmail);

router.patch("/change-password",
    authenticationMiddleware(),
    validationMiddleware(usersValidation.changePassword),
    usersService.changePassword);


router.patch("/confirm-update-email",
    authenticationMiddleware(),
    validationMiddleware(usersValidation.confirmUpdateEmail),
    usersService.confirmUpdateEmail);


// ============================= Account Control ===============================


router.delete("/freez/{:userId}",
    authorizationMiddleware(endPoints.freezAccount),
    validationMiddleware(usersValidation.freezAccount),
    usersService.freezeAccount);

router.patch("/un-freez/:userId/admin",
    authorizationMiddleware(endPoints.unFreezAccountByAdmin),
    validationMiddleware(usersValidation.unFreezAccountByAdmin),
    usersService.unFreezeAccountByAdmin);

router.patch("/un-freez/me",
    validationMiddleware(usersValidation.unFreezAccountByAccountAuther),
    usersService.unFreezeAccountByAccountAuthor);

router.delete("/delete/:userId",
    authorizationMiddleware(endPoints.deleteAccount),
    validationMiddleware(usersValidation.deleteAccount),
    usersService.deleteAccount);








// ============================= Admin Control ===============================


router.get("/change-role/:id",
    authorizationMiddleware(endPoints.changeRole),
    validationMiddleware(usersValidation.changeRole),
    usersService.changeRole);

export default router;