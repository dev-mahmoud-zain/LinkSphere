import { RoleEnum } from "../../DataBase/models/user.model";

export const endPoints = {
    freezAccount: [RoleEnum.admin, RoleEnum.user, RoleEnum.suberAdmin],
    unFreezAccountByAdmin: [RoleEnum.admin, RoleEnum.suberAdmin],
    deleteAccount: [RoleEnum.admin, RoleEnum.suberAdmin],
    changeRole: [RoleEnum.suberAdmin, RoleEnum.admin],
}