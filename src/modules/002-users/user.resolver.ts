import { graphQLValidationMiddleware } from "../../middlewares/validation.middleware";
import { UserService } from "./users.service";
import { GQLValidation } from "./users.validation";


export class UserResolver {
    constructor() { }

    private userService = new UserService();

    allUsers = async (parent: unknown, args: { page: number, limit: number }) => {
        await graphQLValidationMiddleware(GQLValidation.allUsers, args)
        return this.userService.allUsers(args);
    }

    searchForUser = async (parent: unknown, args: { key: string, page: number, limit: number }) => {
        await graphQLValidationMiddleware(GQLValidation.searchForUser, args)
        return this.userService.searchForUser(args);
    }

}