import { Router } from "express";
import { authenticationMiddleware } from "../../middlewares/authentication.middleware";
import { validationMiddleware } from "../../middlewares/validation.middleware";
import { validation } from "./index"
import { SearchService } from "./index";

const router = Router();
const searchService = new SearchService();


router.get("/",
     authenticationMiddleware()
    , validationMiddleware(validation.search), searchService.search);



export default router;