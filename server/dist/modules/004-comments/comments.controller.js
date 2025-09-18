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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const comments_service_1 = require("./comments.service");
const validation_middleware_1 = require("../../middlewares/validation.middleware");
const validation = __importStar(require("./comments.validation"));
const cloud__multer_1 = require("../../utils/multer/cloud.,multer");
const authentication_middleware_1 = require("../../middlewares/authentication.middleware");
const router = (0, express_1.Router)({ mergeParams: true });
const comments = new comments_service_1.Comments();
router.post("/comment", (0, authentication_middleware_1.authenticationMiddeware)(), (0, cloud__multer_1.cloudFileUpload)({
    validation: cloud__multer_1.fileValidation.image,
    storageApproach: cloud__multer_1.StorageEnum.disk
}).single("image"), (0, validation_middleware_1.validationMiddleware)(validation.createComment), comments.createComment);
router.post("/:commentId/reply", (0, authentication_middleware_1.authenticationMiddeware)(), (0, cloud__multer_1.cloudFileUpload)({
    validation: cloud__multer_1.fileValidation.image,
    storageApproach: cloud__multer_1.StorageEnum.disk
}).single("image"), (0, validation_middleware_1.validationMiddleware)(validation.replyOnComment), comments.replyOnComment);
exports.default = router;
