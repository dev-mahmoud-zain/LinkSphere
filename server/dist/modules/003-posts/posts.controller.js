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
const posts_srevice_1 = require("./posts.srevice");
const authentication_middleware_1 = require("../../middlewares/authentication.middleware");
const cloud__multer_1 = require("../../utils/multer/cloud.,multer");
const validation_middleware_1 = require("../../middlewares/validation.middleware");
const validation = __importStar(require("./posts.validation"));
const index_1 = require("../004-comments/index");
const postService = new posts_srevice_1.PostService();
const router = (0, express_1.Router)();
router.use("/:postId/", index_1.router);
router.post("/create-post", (0, authentication_middleware_1.authenticationMiddeware)(), (0, cloud__multer_1.cloudFileUpload)({ validation: cloud__multer_1.fileValidation.image, storageApproach: cloud__multer_1.StorageEnum.disk }).array("attachments", 2), (0, validation_middleware_1.validationMiddleware)(validation.createPost), postService.createPost);
router.patch("/update-post/{:postId}", (0, authentication_middleware_1.authenticationMiddeware)(), (0, cloud__multer_1.cloudFileUpload)({ validation: cloud__multer_1.fileValidation.image, storageApproach: cloud__multer_1.StorageEnum.disk }).array("attachments", 2), (0, validation_middleware_1.validationMiddleware)(validation.updatePost), postService.updatePost);
router.get("/", (0, authentication_middleware_1.authenticationMiddeware)(), (0, validation_middleware_1.validationMiddleware)(validation.getPosts), postService.getPosts);
router.get("/{:postId}", (0, validation_middleware_1.validationMiddleware)(validation.getPost), postService.getPost);
router.post("/like/{:postId}", (0, authentication_middleware_1.authenticationMiddeware)(), (0, validation_middleware_1.validationMiddleware)(validation.likePost), postService.likePost);
exports.default = router;
