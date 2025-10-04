import { PostsResolver } from "./posts.resolver";
import * as PostsGQLArgs from "./posts.args.gql";
import * as PostsGQLTypes from "./posts.gql.types";

export class PostsGQLSchema {
    constructor() { }

    private postsResolver = new PostsResolver();

    registerQuery = () => {
        return {

            allPosts: {
                description: "This Query Is Return All Posts",
                type: PostsGQLTypes.allPosts,
                args: PostsGQLArgs.allPosts,
                resolve: this.postsResolver.allPosts
            },

            searchForPost: {
                description: "This Query Is Return All Posts Matches With Search Key",
                type: PostsGQLTypes.searchForPost,
                args: PostsGQLArgs.searchForPost,
                resolve: this.postsResolver.searchForPost
            },

        }
    }

    registerMutiation = () => {
        return {}
    }
}