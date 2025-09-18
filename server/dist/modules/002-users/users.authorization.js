"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endPoints = void 0;
const user_model_1 = require("../../DataBase/models/user.model");
exports.endPoints = {
    freezAccount: [user_model_1.RoleEnum.admin],
    deleteAccount: [user_model_1.RoleEnum.admin],
};
