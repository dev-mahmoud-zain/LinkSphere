import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";


export const allPosts= {
    page: { type: GraphQLInt },
    limit: { type: GraphQLInt },
}


export const searchForPost = {
    key: { type: new GraphQLNonNull(GraphQLString) },
    page: { type: GraphQLInt },
    limit: { type: GraphQLInt },
}