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
          ? "http://localhost:4000"
          : environment === "staging" ? "https://auth-microservice-stss.onrender.com" 
          : "https://auth-microservice-production-9cd4.up.railway.app",
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
      Product: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          price: { type: "number" },
          category: { type: "string" },
          location: { type: "string" },
          description: { type: "string" },
          productImage: { type: "array", items: { type: "string" } },
        },
      },
      PaginatedProducts: {
        type: "object",
        properties: {
          currentPage: { type: "integer" },
          totalPages: { type: "integer" },
          totalProducts: { type: "integer" },
          products: {
            type: "array",
            items: {
              $ref: "#/components/schemas/Product",
            },
          },
        },
      },
      Admin: {
        type: "object",
        properties: {
          _id: {
            type: "string",
            example: "60d0fe4f5311236168a109cb",
          },
          fullName: {
            type: "string",
            example: "John Doe",
          },
          email: {
            type: "string",
            example: "john.doe@example.com",
          },
          role: {
            type: "string",
            example: "super_admin",
          },
          emailVerified: {
            type: "boolean",
            example: true,
          },
          is_admin: {
            type: "boolean",
            example: true,
          },
          profileImageURL: {
            type: "string",
            example: "http://example.com/avatar.jpg",
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
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
