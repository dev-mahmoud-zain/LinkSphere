import { Response } from "express";
import { HCommentDocument, HPostDocument, HUserDocument } from "../../DataBase/models";

export const successResponse = (
    {
        res,
        statusCode = 200,
        message = "Done",
        info,
        data
    }
        : {
            res: Response
            statusCode?: number,
            message?: string,
            info?: string | object
            data?: object | HUserDocument |HPostDocument | HCommentDocument ,

        }): Response => {

    return res.status(statusCode).json({
        message,
        info,
        statusCode,
        data
    })

}