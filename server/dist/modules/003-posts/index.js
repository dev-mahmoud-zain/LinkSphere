"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postAvailability = exports.router = void 0;
var posts_controller_1 = require("./posts.controller");
Object.defineProperty(exports, "router", { enumerable: true, get: function () { return __importDefault(posts_controller_1).default; } });
var posts_srevice_1 = require("./posts.srevice");
Object.defineProperty(exports, "postAvailability", { enumerable: true, get: function () { return posts_srevice_1.postAvailability; } });
