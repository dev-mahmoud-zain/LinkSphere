import { userGQLTypes, UserResolver } from ".";
import * as userGQLArgs from "./user.args.gql";

export class userGQLSchema {
    constructor() { }

    private userResolver = new UserResolver();

    registerQuery = () => {
        return {

            allUsers: {
                description: "This Query Is Return All Users",
                type: userGQLTypes.allUsers,
                args: userGQLArgs.allUsers,
                resolve: this.userResolver.allUsers
            },

            searchForUser: {
                description: "This Query Is return All Users Matchs With Searching Key , You Can Search By User Id , Email, Full Name or only First Name",
                type: userGQLTypes.searchForUser,
                args:userGQLArgs.searchUser,
                resolve: this.userResolver.searchForUser
            }

        }
    }

    registerMutiation = () => {
        return {}
    }
}