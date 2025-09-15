import { RoleEnum } from "../../DataBase/models/user.model";

export const endPoints = {
    freezAccount: [RoleEnum.admin],
    deleteAccount: [RoleEnum.admin],
}