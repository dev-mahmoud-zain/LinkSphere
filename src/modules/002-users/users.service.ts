import { Response, Request } from "express"
import { HUserDoucment } from "../../DataBase/models/user.model";


class UserServise {

    constructor() { }

    profile = async (req: Request, res: Response) => {
       const  { password , ...safeUser} = req.user?.toObject() as HUserDoucment;




        return res.json({
            message: "Done",
            data: {
                safeUser,
            }
        })
    }

}

export default new UserServise()