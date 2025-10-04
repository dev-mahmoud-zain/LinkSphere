import { GraphQLObjectType, GraphQLSchema } from "graphql";

import { userGQLSchema } from "../002-users"
import { PostsGQLSchema } from "../003-posts";

const _userGQLSchema = new userGQLSchema();
const _PostsGQLSchema = new PostsGQLSchema();

export const GQLSchema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: "RootQueryName",
        fields: {
            ..._userGQLSchema.registerQuery(),
            ..._PostsGQLSchema.registerQuery(),
        }
    }),
})