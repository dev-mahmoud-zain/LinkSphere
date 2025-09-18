"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareHash = exports.generateHash = void 0;
const bcryptjs_1 = require("bcryptjs");
const generateHash = async (plainTxt, saltRound = process.env.SALTROUND || "") => {
    return await (0, bcryptjs_1.hash)(plainTxt, parseInt(saltRound));
};
exports.generateHash = generateHash;
const compareHash = async (plainTxt, hashValue) => {
    return await (0, bcryptjs_1.compare)(plainTxt, hashValue);
};
exports.compareHash = compareHash;
