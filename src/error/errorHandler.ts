import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Handle MulterError (file upload errors)
  if (error.name === 'MulterError') {
    switch (error.code) {
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: `Unexpected file field: '${error.field}'. Please check the correct field name for file upload.`,
          data: {
            field: error.field,
            expectedFields: getExpectedFieldsForRoute(req.route?.path, req.method)
          }
        });

      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: "File size too large. Please upload a smaller file.",
          data: {
            field: error.field,
            limit: "10MB"
          }
        });

      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: "Too many files uploaded. Please reduce the number of files.",
          data: {
            field: error.field,
            limit: "Maximum 10 files"
          }
        });

      case 'LIMIT_FIELD_KEY':
        return res.status(400).json({
          success: false,
          message: "Field name too long.",
          data: error.message
        });

      case 'LIMIT_FIELD_VALUE':
        return res.status(400).json({
          success: false,
          message: "Field value too long.",
          data: error.message
        });

      case 'LIMIT_FIELD_COUNT':
        return res.status(400).json({
          success: false,
          message: "Too many fields in the request.",
          data: error.message
        });

      case 'LIMIT_PART_COUNT':
        return res.status(400).json({
          success: false,
          message: "Too many parts in the multipart request.",
          data: error.message
        });

      default:
        return res.status(400).json({
          success: false,
          message: `File upload error: ${error.message}`,
          data: {
            code: error.code,
            field: error.field
          }
        });
    }
  }

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

// Helper function to provide expected field names based on route
const getExpectedFieldsForRoute = (path: string | undefined, method: string | undefined): string[] => {
  if (!path) return [];
  
  const routeFieldMap: { [key: string]: string[] } = {
    '/createproduct': ['files'],
    '/updateproduct': ['files'],
    '/signup': ['schoolIdCard'],
    '/update-profile': ['profileImage'],
    '/create': ['images'] // for tickets
  };

  for (const [route, fields] of Object.entries(routeFieldMap)) {
    if (path.includes(route)) {
      return fields;
    }
  }
  
  return [];
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
