"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_service_1 = __importDefault(require("./users.service"));
const authentication_middleware_1 = require("../../middlewares/authentication.middleware");
const cloud__multer_1 = require("../../utils/multer/cloud.,multer");
const validation_middleware_1 = require("../../middlewares/validation.middleware");
const usersValidation = __importStar(require("./users.validation"));
const users_authorization_1 = require("./users.authorization");
const router = (0, express_1.Router)();
router.get("/profile", (0, authentication_middleware_1.authenticationMiddeware)(), users_service_1.default.profile);
router.patch("/profile-picture", (0, authentication_middleware_1.authenticationMiddeware)(), (0, cloud__multer_1.cloudFileUpload)({ validation: cloud__multer_1.fileValidation.image, storageApproach: cloud__multer_1.StorageEnum.memory }).single("image"), users_service_1.default.uploadProfilePicture);
router.patch("/profile-cover-images", (0, authentication_middleware_1.authenticationMiddeware)(), (0, cloud__multer_1.cloudFileUpload)({ validation: cloud__multer_1.fileValidation.image, storageApproach: cloud__multer_1.StorageEnum.disk }).array("images", 2), users_service_1.default.uploadCoverImages);
router.delete("/profile-picture", (0, authentication_middleware_1.authenticationMiddeware)(), users_service_1.default.deleteProfilePicture);
router.delete("/profile-cover-images", (0, authentication_middleware_1.authenticationMiddeware)(), users_service_1.default.deleteCoverImages);
router.patch("/update-basic-info", (0, authentication_middleware_1.authenticationMiddeware)(), (0, validation_middleware_1.validationMiddleware)(usersValidation.updateBasicInfo), users_service_1.default.updateBasicInfo);
router.patch("/update-email", (0, authentication_middleware_1.authenticationMiddeware)(), (0, validation_middleware_1.validationMiddleware)(usersValidation.updateEmail), users_service_1.default.updateEmail);
router.patch("/change-password", (0, authentication_middleware_1.authenticationMiddeware)(), (0, validation_middleware_1.validationMiddleware)(usersValidation.changePassword), users_service_1.default.changePassword);
router.patch("/confirm-update-email", (0, authentication_middleware_1.authenticationMiddeware)(), (0, validation_middleware_1.validationMiddleware)(usersValidation.confirmUpdateEmail), users_service_1.default.confirmUpdateEmail);
router.delete("/freez/{:userId}", (0, authentication_middleware_1.authorizationMiddeware)(users_authorization_1.endPoints.freezAccount), (0, validation_middleware_1.validationMiddleware)(usersValidation.freezAccount), users_service_1.default.freezAccount);
router.delete("/delete/{:userId}", (0, authentication_middleware_1.authorizationMiddeware)(users_authorization_1.endPoints.freezAccount), (0, validation_middleware_1.validationMiddleware)(usersValidation.deleteAccount), users_service_1.default.deleteAccount);
exports.default = router;
