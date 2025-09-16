import { Response } from "express";

export const succsesResponse = (
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
            data?: object,

        }): Response => {

    return res.status(statusCode).json({
        message,
        info,
        statusCode,
        data
    })

}