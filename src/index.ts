import express, { Express, Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/api";
import connectDB from "./db";

// Dotenv config
dotenv.config();

// Initialize express server//
const app: Express = express();

// Environmental variables
const port = process.env.PORT || 6000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("combined"));

// Register the routes
app.use("/api", routes);

// Routes
app.get("/", (req: Request, res: Response) => {
  res.send({ message: "Declut-Mart-Auth Express + TypeScript Server" });
});

app.use("*", (req: Request, res: Response) => {
  res.status(404).send("Error 404");
});

// Database Connection
connectDB().then(() => {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
  });
});
