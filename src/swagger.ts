import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { getEnvironment } from "./function/environment";

const swaggerRouter = express.Router();

const environment = getEnvironment();

// Swagger definition
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Declut-Mart API",
    version: "1.0.0",
    description:
      "API documentation for Declut-Mart Express + TypeScript Server",
  },
  servers: [
    {
      url:
        environment === "local"
          ? "http://localhost:9000"
          : "https://auth-microservice-stss.onrender.com",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Category: {
        type: "object",
        properties: {
          _id: {
            type: "string",
            example: "60d0fe4f5311236168a109ca",
          },
          name: {
            type: "string",
            example: "Electronics",
          },
          description: {
            type: "string",
            example: "All electronic gadgets",
          },
        },
      },
    },
  },
};

// Options for swagger-jsdoc
const options = {
  swaggerDefinition,
  apis: ["./src/routes/**/*.ts"], // Path to route files
};

const swaggerSpec = swaggerJsdoc(options);

// Serve Swagger UI
swaggerRouter.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default swaggerRouter;
