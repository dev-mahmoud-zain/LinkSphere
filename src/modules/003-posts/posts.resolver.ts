import { graphQLValidationMiddleware } from "../../middlewares/validation.middleware";
import { PostService } from "./posts.service";
import { GQLValidation } from "./posts.validation";


export class PostsResolver {
    constructor() { }

    private postsService = new PostService();

    allPosts = async (parent: unknown, args: { page: number, limit: number },user:any) => {
        graphQLValidationMiddleware(GQLValidation.allPosts, args);
        return this.postsService.allPosts(args,user);
    }

    searchForPost = async (parent: unknown, args: {key:string, page: number, limit: number }) => {

        graphQLValidationMiddleware(GQLValidation.searchForPost, args);
        return this.postsService.searchForPost(args);
    }

}