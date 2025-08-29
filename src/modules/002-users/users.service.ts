import { Response, Request } from "express"


class UserServise {

    constructor() { }

    profile = async (req: Request, res: Response) => {
        return res.json({
            message: "Done",
            data: {
                user: req.user,
            }
        })
    }

}

export default new UserServise()