import express, { Express, NextFunction, Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/api";
import { rateLimiter } from "./middlewares/rateLimiter";
import { blockBotsMiddleware } from "./middlewares/authMiddleware";
import connectDB from "./db";
import { errorHandler } from "./error/errorHandler";
import swaggerRouter from "./swagger";
import "./cronJob/cron";
import { getEnvironment } from "./function/environment";

// Dotenv config
dotenv.config();

const environment = getEnvironment();

// Initialize express server//
const app: Express = express();

// Environmental variables
const port = process.env.PORT || 6000;

app.set("trust proxy", 1);

const whitelist = ["https://www.declutmart.com", "https://declutmart.com"];

const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("combined"));

if (["production", "staging"].includes(environment)) {
  app.use(rateLimiter);
  app.use(blockBotsMiddleware);
}

// Routes
app.get("/", (req: Request, res: Response) => {
  res.send({ message: "Declut-Mart Express + TypeScript Server" });
});

app.use("/api", routes);
app.use("/", swaggerRouter);

app.use("*", (req: Request, res: Response) => {
  // res.status(404).send("Error 404");
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, req, res, next);
});

// Database Connection
connectDB().then(() => {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  });
});
