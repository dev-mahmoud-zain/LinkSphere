import { RoleEnum } from "../../DataBase/models/user.model";

export const endPoints = {
    freezeAccount: [RoleEnum.admin, RoleEnum.user, RoleEnum.suberAdmin],
    unfreezeAccountByAdmin: [RoleEnum.admin, RoleEnum.suberAdmin],
    deleteAccount: [RoleEnum.admin, RoleEnum.suberAdmin],
    changeRole: [RoleEnum.suberAdmin, RoleEnum.admin],
}