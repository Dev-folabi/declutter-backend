import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const swaggerRouter = express.Router();

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Declut-Mart API',
    version: '1.0.0',
    description: 'API documentation for Declut-Mart Express + TypeScript Server',
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 6000}`|| "https://auth-microservice-stss.onrender.com",
    },
  ],
};

// Options for swagger-jsdoc
const options = {
  swaggerDefinition,
  apis: ['./src/routes/**/*.ts'], // Path to route files
};

const swaggerSpec = swaggerJsdoc(options);

// Serve Swagger UI
swaggerRouter.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default swaggerRouter;
