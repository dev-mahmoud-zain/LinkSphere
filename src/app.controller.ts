import express from "express";
import type { Request, Response } from "express";

import cors from "cors";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";

// Setup Env Config
import { resolve } from "node:path";
import { config } from "dotenv";
config({ path: resolve("./config/.env.development") });

import {
  authRouter,
  postsRouter,
  usersRouter,
  searchRouter,
  initializeIo,
} from "./modules/";
import {
  globalErrorHandler,
} from "./utils/response/error.response";
import connectToDataBase from "./DataBase/DB_Connection";

// GQL
import { createHandler } from "graphql-http/lib/use/express";
import { GQLSchema } from "./modules/graphql";
import { authenticationMiddleware } from "./middlewares/authentication.middleware";

import morgan from "morgan";



// App Start Point
export default async function bootstrap(): Promise<void> {
  const app = express();
  const port: Number | String = process.env.PORT || 3000;

  // Third Party MiddleWares
  const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 2000,
    message: { error: "Too Many Requests , Try Again Later" },
    statusCode: 429,
  });
  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: ["http://localhost:4200", "http://127.0.0.1:5500"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    })
  );

  app.use(helmet());
  app.use(express.json());
  app.use(limiter);
  app.use(morgan("dev"));

  // DataBase
  await connectToDataBase();

  // Application Routing

  app.all(
    "/graphql",
    authenticationMiddleware(),
    createHandler({
      schema: GQLSchema,
      context: (req) => ({ user: req.raw.user }),
    })
  );

  // Main Router
  app.get("/", (req: Request, res: Response): Response => {
    res.set("Cache-Control", "no-store");
    return res.status(200).json({
      message: "Welcome To LinkSphere BackEnd API",
      info: "LinkSphere is a social networking application that connects people, enables sharing posts, and fosters meaningful interactions in a modern digital community.",
      about: "This APP Created By Dev: Adham Zain @2025",
    });
  });

  // Authentication Router
  app.use("/auth", authRouter);
  // Users Router
  app.use("/users", usersRouter);

  // Users Router
  app.use("/posts", postsRouter);

  app.use("/search", searchRouter);


  app.use(globalErrorHandler);

  // 404 Router
  app.all("{*dummy}", (req: Request, res: Response) => {
    res.status(404).json({
      message: "Page Not Found",
      info: "Place Check Your Method And URL Path",
      method: req.method,
      path: req.path,
    });
  });

   const httpServer = app.listen(port, () => {
    console.log("===================================");
    console.log(`LinkSphere App Is Ruining Success on Port :: ${port}`);
    console.log("===================================");
  });

 // ============================== SOCKET IO ==============================



  initializeIo(httpServer);






}