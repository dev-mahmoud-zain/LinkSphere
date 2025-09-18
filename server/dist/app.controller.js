"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = bootstrap;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = require("express-rate-limit");
const helmet_1 = __importDefault(require("helmet"));
const node_path_1 = require("node:path");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: (0, node_path_1.resolve)("./config/.env.development") });
const modules_1 = require("./modules/");
const error_response_1 = require("./utils/response/error.response");
const DB_Connection_1 = __importDefault(require("./DataBase/DB_Connection"));
async function bootstrap() {
    const app = (0, express_1.default)();
    const port = process.env.PORT || 5000;
    app.use((0, cors_1.default)());
    app.use((0, helmet_1.default)());
    const limiter = (0, express_rate_limit_1.rateLimit)({
        windowMs: 60 * 6000,
        limit: 2000,
        message: { error: "Too Many Requests , Try Again Later" },
        statusCode: 429
    });
    app.use(limiter);
    app.use(express_1.default.json());
    await (0, DB_Connection_1.default)();
    app.get("/", (req, res) => {
        return res.json({
            message: "Welcome To LinkSphere BackEnd API",
            info: "LinkSphere is a social networking application that connects people, enables sharing posts, and fosters meaningful interactions in a modern digital community.",
            about: "This APP Created By Dev:Adham Zain @2025",
        });
    });
    app.use("/auth", modules_1.authRouter);
    app.use("/users", modules_1.usersRouter);
    app.use("/posts", modules_1.postsRouter);
    app.use(error_response_1.glopalErrorHandler);
    app.all("{*dummy}", (req, res) => {
        res.status(404).json({
            message: "Page Not Found",
            info: "Plase Check Your Method And URL Path",
            method: req.method,
            path: req.path
        });
    });
    app.listen(port, () => {
        console.log("===================================");
        console.log("LinkSphere App Is Runing Succses 🚀");
        console.log("===================================");
    });
}
