import { Router } from "express";
import usersService from "./users.service";
import { authenticationMiddeware, authorizationMiddeware } from "../../middlewares/authentication.middleware";
import { cloudFileUpload, fileValidation, StorageEnum } from "../../utils/multer/cloud.,multer";
import { validationMiddleware } from "../../middlewares/validation.middleware";
import * as usersValidation from "./users.validation";
import { endPoints } from "./users.authorization";

const usersRouter = Router();

usersRouter.get("/profile", authenticationMiddeware(), usersService.profile);

usersRouter.patch("/profile-picture",
    authenticationMiddeware(),
    cloudFileUpload({ validation: fileValidation.image, storageApproach: StorageEnum.memory }).single("image")
    , usersService.uploadProfilePicture);

usersRouter.delete("/profile-picture",
    authenticationMiddeware(),
    usersService.deleteProfilePicture);


usersRouter.patch("/profile-cover-images",
    authenticationMiddeware(),
    cloudFileUpload({ validation: fileValidation.image, storageApproach: StorageEnum.disk }).array("images", 2)
    , usersService.uploadCoverImages);


usersRouter.delete("/cover-images",
    authenticationMiddeware(),
    usersService.deleteCoverImages);

usersRouter.delete("/freez/{:userId}",
    authorizationMiddeware(endPoints.freezAccount),
    validationMiddleware(usersValidation.freezAccount),
    usersService.freezAccount);

usersRouter.delete("/delete/{:userId}",
    authorizationMiddeware(endPoints.freezAccount),
    validationMiddleware(usersValidation.deleteAccount),
    usersService.deleteAccount);

export default usersRouter;