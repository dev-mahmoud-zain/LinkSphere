import {
    DeleteObjectCommand, DeleteObjectCommandOutput,
    DeleteObjectsCommand,
    DeleteObjectsCommandOutput,
    GetObjectCommand,
    ListObjectsV2Command,
    ObjectCannedACL,
    PutObjectCommand,
    S3Client
} from "@aws-sdk/client-s3"
import { v4 as uuid } from "uuid"
import { StorageEnum } from "./cloud.,multer"
import { createReadStream } from "fs"
import { BadRequestException } from "../response/error.response"
import { Upload } from "@aws-sdk/lib-storage"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3Config = () => {

    return new S3Client({
        region: process.env.S3_REGION as string,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_Id as string,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string
        }
    })

}
export const uploadFile = async (
    {
        storageApproach = StorageEnum.memory,
        Bucket = process.env.S3_BUCKET_NAME as string,
        ACL = "private",
        path = "general",
        file,
    }: {
        storageApproach?: StorageEnum,
        Bucket?: string,
        ACL?: ObjectCannedACL,
        path?: string,
        file: Express.Multer.File
    }
): Promise<string> => {

    const command = new PutObjectCommand({
        Bucket,
        ACL,
        Key: `${process.env.APPLCATION_NAME}/${path}/${uuid()}_${file.originalname}`,
        Body: storageApproach === StorageEnum.memory && file.buffer
            ? file.buffer
            : createReadStream(file.path),
        ContentType: file.mimetype,
    })

    await s3Config().send(command);



    if (!command?.input?.Key) {
        throw new BadRequestException("Fail To Generate Upload Key");
    }


    return command.input.Key;

}

export const uploadLargeFile = async (
    {
        Bucket = process.env.S3_BUCKET_NAME as string,
        ACL = "private",
        path = "general",
        file,
    }: {
        storageApproach?: StorageEnum,
        Bucket?: string,
        ACL?: ObjectCannedACL,
        path?: string,
        file: Express.Multer.File
    }
): Promise<string> => {

    const upload = new Upload({
        client: s3Config(),
        params: {
            Bucket,
            ACL,
            Key: `${process.env.APPLCATION_NAME}/${path}/${uuid()}_${file.originalname}`,
            Body: createReadStream(file.path),
            ContentType: file.mimetype,
        }
    })

    // upload.on("httpUploadProgress", (progress) => {
    //     console.log(progress)
    // });


    const { Key } = await upload.done();

    if (!Key) {
        throw new BadRequestException("Fail To Generate Upload Key");
    }

    return Key

}

export const uploadFiles = async (
    {
        storageApproach = StorageEnum.disk,
        Bucket = process.env.S3_BUCKET_NAME as string,
        ACL = "private",
        path = "general",
        files,
        largeFiles = false,
    }: {
        storageApproach?: StorageEnum,
        Bucket?: string,
        ACL?: ObjectCannedACL,
        path?: string,
        files: Express.Multer.File[],
        largeFiles?: boolean
    }
): Promise<string[]> => {

    let urls = [];

    if (largeFiles) {

        urls = await Promise.all(files.map((file) => {

            return uploadLargeFile({
                file,
                path,
                ACL,
                Bucket,
                storageApproach,
            })
        }))


    }
    else {

        urls = await Promise.all(files.map((file) => {
            return uploadFile({
                file,
                path,
                ACL,
                Bucket,
                storageApproach
            })
        }))


    }

    return urls;

}

export const createPreSigndUploadUrl = async (
    {
        Bucket = process.env.S3_BUCKET_NAME as string,
        path = "general",
        Originalname,
        ContentType,
        expiresIn = 60
    }: {
        Bucket?: string,
        path?: string,
        Originalname: string,
        ContentType: string,
        expiresIn?: number
    }
): Promise<{ url: string, key: string }> => {

    const command = new PutObjectCommand({
        Bucket,
        Key: `${process.env.APPLCATION_NAME}/${path}/${uuid()}_${Originalname}`,
        ContentType
    })

    const url = await getSignedUrl(s3Config(), command, { expiresIn })

    if (!url || !command?.input?.Key) {
        throw new BadRequestException("Fail To Create Presigned Url")
    }
    return { url, key: command.input.Key }

}

export const getAsset = async ({
    Bucket = process.env.S3_BUCKET_NAME as string,
    Key
}: {
    Bucket?: string,
    Key: string
}) => {

    const command = new GetObjectCommand({
        Bucket,
        Key
    });

    return await s3Config().send(command);
}

export const getPreSignedUrl = async (
    {
        Bucket = process.env.S3_BUCKET_NAME as string,
        Key
    }: {
        Bucket?: string,
        Key: string
    }
) => {

    const command = new GetObjectCommand({
        Bucket,
        Key
    });


    return await getSignedUrl(s3Config(), command, { expiresIn: 3600 });

}

export const deleteFile = async (
    {
        Bucket = process.env.S3_BUCKET_NAME as string,
        Key
    }: {
        Bucket?: string,
        Key: string
    }
): Promise<DeleteObjectCommandOutput> => {

    const command = new DeleteObjectCommand({
        Bucket,
        Key
    });


    return await s3Config().send(command);

}

export const deleteFiles = async (
    {
        Bucket = process.env.S3_BUCKET_NAME as string,
        urls,
        Quiet = false
    }: {
        Bucket?: string,
        urls: string[],
        Quiet?: boolean
    }
): Promise<DeleteObjectsCommandOutput> => {

    const Objects = urls.map((url) => {
        return { Key: url }
    });

    const command = new DeleteObjectsCommand({
        Bucket,
        Delete: {
            Objects,
            Quiet
        }
    });

    return s3Config().send(command);

}

export const listDirectoryFiles = async (
    {
        Bucket = process.env.S3_BUCKET_NAME as string,
        path,
    }: {
        Bucket?: string,
        path: string,
    }
) => {

    const command = new ListObjectsV2Command({
        Bucket,
        Prefix: `${process.env.APPLCATION_NAME}/${path}`
    })

    return s3Config().send(command);
}





export const deleteFolderByPrefix = async (
    {
        Bucket = process.env.S3_BUCKET_NAME as string,
        path,
        Quiet = false
    }: {
        Bucket?: string,
        path: string,
        Quiet?: boolean
    }
): Promise<DeleteObjectsCommandOutput> => {

    const files = await listDirectoryFiles({ Bucket, path });
    let urls: string[] = [];

    if (files.Contents?.length) {
        urls = files.Contents?.map((file) => {
            return file.Key as string;
        })
    }

    return await deleteFiles({ Bucket, urls });

}