import { Router } from "express";
import usersService from "./users.service";
import { authenticationMiddeware } from "../../middlewares/authentication.middleware";
import { cloudFileUpload, fileValidation, StorageEnum } from "../../utils/multer/cloud.,multer";

const usersRouter = Router();


usersRouter.get("/profile", authenticationMiddeware(), usersService.profile);

usersRouter.patch("/profile-picture",
    authenticationMiddeware(),
    cloudFileUpload({ validation: fileValidation.image, storageApproach: StorageEnum.memory }).single("image")
    , usersService.uploadProfilePicture);

    

usersRouter.patch("/profile-cover-images",
    authenticationMiddeware(),
    cloudFileUpload({ validation: fileValidation.image, storageApproach: StorageEnum.disk }).array("images",2)
    , usersService.uploadCoverImages);

export default usersRouter;