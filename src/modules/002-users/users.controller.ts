import { Router } from "express";
import usersService from "./users.service";
import { authenticationMiddeware, authorizationMiddeware } from "../../middlewares/authentication.middleware";
import { cloudFileUpload, fileValidation, StorageEnum } from "../../utils/multer/cloud.,multer";
import { validationMiddleware } from "../../middlewares/validation.middleware";
import * as usersValidation from "./users.validation";
import { endPoints } from "./users.authorization";

const router = Router();

router.get("/profile",
    authenticationMiddeware(),
    usersService.profile);


router.patch("/change-password",
    authenticationMiddeware(),
    validationMiddleware(usersValidation.changePassword),
    usersService.changePassword);

router.patch("/profile-picture",
    authenticationMiddeware(),
    cloudFileUpload({ validation: fileValidation.image, storageApproach: StorageEnum.memory }).single("image")
    , usersService.uploadProfilePicture);

router.delete("/profile-picture",
    authenticationMiddeware(),
    usersService.deleteProfilePicture);


router.patch("/profile-cover-images",
    authenticationMiddeware(),
    cloudFileUpload({ validation: fileValidation.image, storageApproach: StorageEnum.disk }).array("images", 2)
    , usersService.uploadCoverImages);


router.delete("/cover-images",
    authenticationMiddeware(),
    usersService.deleteCoverImages);

router.delete("/freez/{:userId}",
    authorizationMiddeware(endPoints.freezAccount),
    validationMiddleware(usersValidation.freezAccount),
    usersService.freezAccount);

router.delete("/delete/{:userId}",
    authorizationMiddeware(endPoints.freezAccount),
    validationMiddleware(usersValidation.deleteAccount),
    usersService.deleteAccount);

router.patch("/update-basic-info",
    authenticationMiddeware(),
    validationMiddleware(usersValidation.updateBasicInfo),
    usersService.updateBasicInfo);


router.patch("/update-email",
    authenticationMiddeware(),
    validationMiddleware(usersValidation.updateEmail),
    usersService.updateEmail);


router.patch("/confirm-update-email",
    authenticationMiddeware(),
    validationMiddleware(usersValidation.confirmUpdateEmail),
    usersService.confirmUpdateEmail);

export default router;