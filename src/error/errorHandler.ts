import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error.name === 'MongoError') {
    switch (error.code) {
      case 11000:
        // Duplicate key error
        return res.status(409).json({
          success: false,
          message: "Duplicate key error: Data already exists",
          data: error.keyValue || {},
        });

      case 121:
        // Document validation failed
        return res.status(400).json({
          success: false,
          message: "Document validation failed",
          data: error.message,
        });

      case 50:
        // Timeout error
        return res.status(503).json({
          success: false,
          message: "Operation timed out",
          data: error.message,
        });

      case 2:
        // Not master error
        return res.status(500).json({
          success: false,
          message: "Not master error: Please try again later",
          data: error.message,
        });

      default:
        // Catch-all for unknown MongoDB errors
        return res.status(500).json({
          success: false,
          message: `An unknown database error occurred (code: ${error.code})`,
          data: error.message,
        });
    }
  }

  // Handle other non-MongoDB errors
  console.error("Unhandled Error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    data: error.message || error,
  });
};

// Unified error response helper
export const handleError = (
  res: Response,
  status = 400,
  message: string,
  data = null
) => {
  res.status(status).json({ success: false, message, data });
};
