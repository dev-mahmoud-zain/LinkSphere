import { Response, Request } from "express"
import { HUserDoucment, UserModel } from "../../DataBase/models/user.model";
import {
    deleteFile,
    deleteFiles,
    deleteFolderByPrefix,
    getPreSigndUrl,
    uploadFile,
    uploadFiles
} from "../../utils/multer/s3.config";
import { ApplicationException, BadRequestException, NotFoundException } from "../../utils/response/error.response";
import { UserRepository } from "../../DataBase/repository/user.repository";
import { JwtPayload } from "jsonwebtoken";
import { succsesResponse } from "../../utils/response/succses.response";

class UserServise {

    private usermodel = new UserRepository(UserModel)
    constructor() { }

    profile = async (req: Request, res: Response): Promise<Response> => {
        const { password, ...safeUser } = req.user?.toObject() as HUserDoucment;

        if (safeUser.picture) {
            const key = await getPreSigndUrl({ Key: safeUser.picture });
            safeUser.picture = key
        }

        if (safeUser.coverImages) {
            let keys = []
            for (const Key of safeUser.coverImages) {
                keys.push(await getPreSigndUrl({ Key }));
            }
            safeUser.coverImages = keys;
        }


        return succsesResponse({
            res,
            data: { safeUser }
        })




    }

    uploadProfilePicture = async (req: Request, res: Response): Promise<Response> => {

        const { _id } = req.tokenDecoded as JwtPayload

        const key = await uploadFile({
            file: req.file as Express.Multer.File,
            path: `users/${_id}`
        })

        const update = await this.usermodel.updateOne({
            _id
        }, {
            picture: key
        })

        if (!update) {
            throw new BadRequestException("Fail To Upload Profile Picture")
        }

        return succsesResponse({
            res,
            info: "Profile Picture Uploaded Succses",
            data: { key }
        })


    }

    deleteProfilePicture = async (req: Request, res: Response): Promise<Response> => {

        const { _id } = req.tokenDecoded as JwtPayload
        const Key = req.user?.picture;

        if (!Key) {
            throw new NotFoundException("User Has No Profile Picture")
        }

        const deleted = await deleteFile({ Key });

        if (!deleted) {
            throw new ApplicationException("Faild To Delete Profile Picture");
        }

        await this.usermodel.updateOne({ _id }, {
            $unset: { picture: 1 }
        })

        return succsesResponse({
            res,
            info: "Profile Picture Deleted Succses",
        })



    }

    uploadCoverImages = async (req: Request, res: Response): Promise<Response> => {

        const { _id } = req.tokenDecoded as JwtPayload

        if (!req.files?.length) {
            throw new BadRequestException("No files uploaded")
        }

        const keys = await uploadFiles({
            files: req.files as Express.Multer.File[],
            path: `users/${req.tokenDecoded?._id}/cover`
        })

        await this.usermodel.updateOne({ _id }, {
            coverImages: keys
        })

        return succsesResponse({
            res,
            info: "Profile Picture Uploaded Succses",
            data: { keys }
        })



    }

    deleteCoverImages = async (req: Request, res: Response): Promise<Response> => {

        const { _id } = req.tokenDecoded as JwtPayload
        const urls = req.user?.coverImages;

        if (!urls?.length) {
            throw new NotFoundException("User Has No Cover Images")
        }

        const deleted = await deleteFiles({ urls });

        if (!deleted) {
            throw new ApplicationException("Faild To Delete Cover Images");
        }

        await this.usermodel.updateOne({ _id }, {
            $unset: { coverImages: 1 }
        })

        return succsesResponse({
            res,
            info: "Cover Images Deleted Succses",
        })

    }

    freezAccount = async (req: Request, res: Response): Promise<Response> => {

        const adminId = req.tokenDecoded?._id;
        let { userId } = req.params;

        if (!userId) {
            // لنفسه Freez  يعمل 
            userId = adminId;
        }

        const freezedAccount = await this.usermodel.updateOne({
            _id: userId,
            freezedAt: { $exists: false },
            freezedBy: { $exists: false },
        }, {
            $set: {
                freezedAt: new Date(),
                freezedBy: adminId,
                changeCredentialsTime: new Date()
            },
            $unset: {
                restoredAt: 1,
                restoredBy: 1
            }
        })

        if (!freezedAccount) {
            throw new BadRequestException("Faild To Freez Account")
        }

        return succsesResponse({
            res,
            info: "Account Freezed Succses",
        })


    }

    deleteAccount = async (req: Request, res: Response): Promise<Response> => {

        const { userId } = req.params;

        const user = await this.usermodel.findOne({ filter: { _id: userId } });


        if (!user) {
            throw new NotFoundException("User Not Found")
        }

        if (!user.freezedAt) {
            throw new BadRequestException("Cannot Delete Not Freezed Account");
        }

        const deletedUser = await this.usermodel.deleteOne({ _id: userId });

        if (!deletedUser.deletedCount) {
            throw new BadRequestException("Faild To Delete User")
        }

        await deleteFolderByPrefix({ path: `users/${user._id}` });

        return succsesResponse({
            res,
            info: "Account Deleted Succses",
        })

    }


}

export default new UserServise()