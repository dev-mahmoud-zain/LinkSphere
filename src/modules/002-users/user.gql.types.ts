import { GraphQLID, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString } from "graphql";

const UserType = new GraphQLObjectType({
    name: "User",
    fields: {
        _id: { type: GraphQLID },
        firstName: { type: GraphQLString },
        lastName: { type: GraphQLString },
        slug: { type: GraphQLString },
         picture: { type: GraphQLString },
        phone: { type: GraphQLString },
        gender: { type: GraphQLString },
        role: { type: GraphQLString },
        userName: { type: GraphQLString },
        email: { type: GraphQLString },
    }
});


export const allUsers = new GraphQLObjectType({
    name: "AllUsers",
    fields: {
        count: { type: GraphQLInt },
        page: { type: GraphQLInt },
        limit: { type: GraphQLInt },
        users: { type: new GraphQLList(UserType) }
    }
});


export const searchForUser = new GraphQLObjectType({
    name: "SearchUserResult",
    fields: {
        count: { type: GraphQLInt },
        page: { type: GraphQLInt },
        limit: { type: GraphQLInt },
        users: { type: new GraphQLList(UserType) }
    }
});
