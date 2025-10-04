import { GraphQLID, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString } from "graphql";

const PostType = new GraphQLObjectType({
    name: "Post",
    fields: {
        _id: { type: GraphQLID },
        content:{type : GraphQLString } ,
        createdBy: { type: GraphQLID },
        attachments: { type: new GraphQLList(GraphQLID) },
        availability: { type: GraphQLString },
        except: { type: new GraphQLList(GraphQLID) },
        only: { type: new GraphQLList(GraphQLID) },
        allowComments: { type:GraphQLString},
        tags :{ type: new GraphQLList(GraphQLID) } ,
        likes : { type: new GraphQLList(GraphQLID) } ,
        createdAt :{type : GraphQLString } ,
        updatedAt :{type : GraphQLString } ,
    }
});

export const allPosts = new GraphQLObjectType({
    name: "AllPosts",
    fields: {
        count: { type: GraphQLInt },
        page: { type: GraphQLInt },
        limit: { type: GraphQLInt },
        posts: { type: new GraphQLList(PostType) }
    }
});

export const searchForPost = new GraphQLObjectType({
    name: "SearchPostResult",
    fields: {
        count: { type: GraphQLInt },
        page: { type: GraphQLInt },
        limit: { type: GraphQLInt },
        posts: { type: new GraphQLList(PostType) }
    }
});