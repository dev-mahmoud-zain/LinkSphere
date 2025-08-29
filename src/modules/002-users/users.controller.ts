import {  Router } from "express";
import usersService from "./users.service";
import { authenticationMiddeware } from "../../middlewares/authentication.middleware";

const usersRouter = Router();


usersRouter.get("/profile", authenticationMiddeware() ,usersService.profile)






export default usersRouter;