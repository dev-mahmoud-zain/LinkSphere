import { Response, Request } from "express"
import { HUserDoucment, UserModel } from "../../DataBase/models/user.model";
import { getPreSigndUrl, uploadFile, uploadFiles } from "../../utils/multer/s3.config";
import { BadRequestException } from "../../utils/response/error.response";
import { UserRepository } from "../../DataBase/repository/user.repository";
import { JwtPayload } from "jsonwebtoken";


class UserServise {

    private usermodel = new UserRepository(UserModel)
    constructor() { }

    profile = async (req: Request, res: Response) => {
        const { password, ...safeUser } = req.user?.toObject() as HUserDoucment;

        if (safeUser.picture) {
            const key = await getPreSigndUrl({ Key: safeUser.picture });
            safeUser.picture = key
        }

        return res.json({
            message: "Done",
            data: {
                safeUser,
            }
        });

    }

    uploadProfilePicture = async (req: Request, res: Response) => {

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

        return res.json({
            message: "Done",
            info: "Profile Picture Uploaded Succses",
            data: { key }
        });

    }

    uploadCoverImages = async (req: Request, res: Response) => {

        if (!req.files?.length) {
            throw new BadRequestException("No files uploaded")
        }

        const keys = await uploadFiles({
            files: req.files as Express.Multer.File[],
            path: `users/${req.tokenDecoded?._id}/cover`
        })





        return res.json({
            message: "Done",
            info: "Profile Picture Uploaded Succses",
            data: { keys }
        });

    }



}

export default new UserServise()