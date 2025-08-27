// Import Express And Express Types
import express from "express";
import type { Request, Response } from "express";

// Import Third Party MiddleWare
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";

// Setup Env Config
import { resolve } from "node:path";
import { config } from "dotenv";
config({ path: resolve("./config/.env.development") })

// Import Modules Routers
import authRouter from "./modules/001-auth/auth.controller";
import { glopalErrorHandler } from "./utils/response/error.response";
import connectToDataBase from "./DataBase/DB_Connection";





// App Start Point
export default async function bootstrap() :Promise<void> {

    const app = express();
    const port: Number | String = process.env.PORT || 5000;

    // Third Party MiddleWares

    app.use(cors());

    app.use(helmet());

    const limiter = rateLimit({
        windowMs: 60 * 6000,
        limit: 2000,
        message: { error: "Too Many Requests , Try Again Later" },
        statusCode: 429
    });
    app.use(limiter);

    app.use(express.json());

    // DataBase
   await connectToDataBase();

    // AppLcation Routing 

    // Main Router
    app.get("/", (req: Request, res: Response) => {
        res.json({
            message: "Welcome To LinkSphere BackEnd API",
            info: "LinkSphere is a social networking application that connects people, enables sharing posts, and fosters meaningful interactions in a modern digital community.",
            about: "This APP Created By Dev:Adham Zain @2025",
        })
    })

    // Authentacition Router
    app.use("/auth", authRouter);

    // Glopal Error Handler


    app.use(glopalErrorHandler)



    // 404 Router 
    app.all("{*dummy}", (req: Request, res: Response) => {
        res.status(404).json({
            message: "Page Not Found",
            info: "Plase Check Your Method And URL Path ❌",
            method: req.method,
            path: req.path
        })
    });

    app.listen(port, () => {
        console.log("===================================")
        console.log("LinkSphere App Is Runing Succses 🚀")
        console.log("===================================")
    });
}