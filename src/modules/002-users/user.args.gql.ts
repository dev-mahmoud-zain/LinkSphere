import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";


export const allUsers = {
    page: { type: GraphQLInt },
    limit: { type: GraphQLInt },
}


export const searchUser = {
    key: { type: new GraphQLNonNull(GraphQLString) },
    page: { type: GraphQLInt },
    limit: { type: GraphQLInt },
}