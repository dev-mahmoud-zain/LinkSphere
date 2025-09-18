"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postsRouter = exports.usersRouter = exports.authRouter = void 0;
var _001_auth_1 = require("./001-auth");
Object.defineProperty(exports, "authRouter", { enumerable: true, get: function () { return _001_auth_1.router; } });
var _002_users_1 = require("./002-users");
Object.defineProperty(exports, "usersRouter", { enumerable: true, get: function () { return _002_users_1.router; } });
var _003_posts_1 = require("./003-posts");
Object.defineProperty(exports, "postsRouter", { enumerable: true, get: function () { return _003_posts_1.router; } });
