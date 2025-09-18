"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const user_model_1 = require("./models/user.model");
const connectToDataBase = async () => {
    try {
        await (0, mongoose_1.connect)(process.env.DB_CONNECTION_URL);
        user_model_1.UserModel.syncIndexes();
        console.log("DataBase Connected Succses");
    }
    catch (error) {
        console.log("\nX X X X X X X X X X X X X X X X X X X X X X X");
        console.log("Faild To Connect DataBase");
        console.log("X X X X X X X X X X X X X X X X X X X X X X X\n");
        console.log(error);
    }
};
exports.default = connectToDataBase;
