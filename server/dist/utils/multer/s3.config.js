"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFolderByPrefix = exports.listDirectoryFiles = exports.deleteFiles = exports.deleteFile = exports.getPreSigndUrl = exports.getAsset = exports.createPreSigndUploadUrl = exports.uploadFiles = exports.uploadLargeFile = exports.uploadFile = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
const cloud__multer_1 = require("./cloud.,multer");
const fs_1 = require("fs");
const error_response_1 = require("../response/error.response");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const s3Config = () => {
    return new client_s3_1.S3Client({
        region: process.env.S3_REGION,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_Id,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
        }
    });
};
const uploadFile = async ({ storageApproach = cloud__multer_1.StorageEnum.memory, Bucket = process.env.S3_BUCKET_NAME, ACL = "private", path = "general", file, }) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket,
        ACL,
        Key: `${process.env.APPLCATION_NAME}/${path}/${(0, uuid_1.v4)()}_${file.originalname}`,
        Body: storageApproach === cloud__multer_1.StorageEnum.memory && file.buffer
            ? file.buffer
            : (0, fs_1.createReadStream)(file.path),
        ContentType: file.mimetype,
    });
    await s3Config().send(command);
    if (!command?.input?.Key) {
        throw new error_response_1.BadRequestException("Fail To Generate Upload Key");
    }
    return command.input.Key;
};
exports.uploadFile = uploadFile;
const uploadLargeFile = async ({ Bucket = process.env.S3_BUCKET_NAME, ACL = "private", path = "general", file, }) => {
    const upload = new lib_storage_1.Upload({
        client: s3Config(),
        params: {
            Bucket,
            ACL,
            Key: `${process.env.APPLCATION_NAME}/${path}/${(0, uuid_1.v4)()}_${file.originalname}`,
            Body: (0, fs_1.createReadStream)(file.path),
            ContentType: file.mimetype,
        }
    });
    const { Key } = await upload.done();
    if (!Key) {
        throw new error_response_1.BadRequestException("Fail To Generate Upload Key");
    }
    return Key;
};
exports.uploadLargeFile = uploadLargeFile;
const uploadFiles = async ({ storageApproach = cloud__multer_1.StorageEnum.disk, Bucket = process.env.S3_BUCKET_NAME, ACL = "private", path = "general", files, largeFiles = false, }) => {
    let urls = [];
    if (largeFiles) {
        urls = await Promise.all(files.map((file) => {
            return (0, exports.uploadLargeFile)({
                file,
                path,
                ACL,
                Bucket,
                storageApproach,
            });
        }));
    }
    else {
        urls = await Promise.all(files.map((file) => {
            return (0, exports.uploadFile)({
                file,
                path,
                ACL,
                Bucket,
                storageApproach
            });
        }));
    }
    return urls;
};
exports.uploadFiles = uploadFiles;
const createPreSigndUploadUrl = async ({ Bucket = process.env.S3_BUCKET_NAME, path = "general", Originalname, ContentType, expiresIn = 60 }) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket,
        Key: `${process.env.APPLCATION_NAME}/${path}/${(0, uuid_1.v4)()}_${Originalname}`,
        ContentType
    });
    const url = await (0, s3_request_presigner_1.getSignedUrl)(s3Config(), command, { expiresIn });
    if (!url || !command?.input?.Key) {
        throw new error_response_1.BadRequestException("Fail To Create Presigned Url");
    }
    return { url, key: command.input.Key };
};
exports.createPreSigndUploadUrl = createPreSigndUploadUrl;
const getAsset = async ({ Bucket = process.env.S3_BUCKET_NAME, Key }) => {
    const command = new client_s3_1.GetObjectCommand({
        Bucket,
        Key
    });
    return await s3Config().send(command);
};
exports.getAsset = getAsset;
const getPreSigndUrl = async ({ Bucket = process.env.S3_BUCKET_NAME, Key }) => {
    const command = new client_s3_1.GetObjectCommand({
        Bucket,
        Key
    });
    return await (0, s3_request_presigner_1.getSignedUrl)(s3Config(), command, { expiresIn: 3600 });
};
exports.getPreSigndUrl = getPreSigndUrl;
const deleteFile = async ({ Bucket = process.env.S3_BUCKET_NAME, Key }) => {
    const command = new client_s3_1.DeleteObjectCommand({
        Bucket,
        Key
    });
    return await s3Config().send(command);
};
exports.deleteFile = deleteFile;
const deleteFiles = async ({ Bucket = process.env.S3_BUCKET_NAME, urls, Quiet = false }) => {
    const Objects = urls.map((url) => {
        return { Key: url };
    });
    const command = new client_s3_1.DeleteObjectsCommand({
        Bucket,
        Delete: {
            Objects,
            Quiet
        }
    });
    return s3Config().send(command);
};
exports.deleteFiles = deleteFiles;
const listDirectoryFiles = async ({ Bucket = process.env.S3_BUCKET_NAME, path, }) => {
    const command = new client_s3_1.ListObjectsV2Command({
        Bucket,
        Prefix: `${process.env.APPLCATION_NAME}/${path}`
    });
    return s3Config().send(command);
};
exports.listDirectoryFiles = listDirectoryFiles;
const deleteFolderByPrefix = async ({ Bucket = process.env.S3_BUCKET_NAME, path, Quiet = false }) => {
    const files = await (0, exports.listDirectoryFiles)({ Bucket, path });
    let urls = [];
    if (files.Contents?.length) {
        urls = files.Contents?.map((file) => {
            return file.Key;
        });
    }
    return await (0, exports.deleteFiles)({ Bucket, urls });
};
exports.deleteFolderByPrefix = deleteFolderByPrefix;
