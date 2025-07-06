import { Request, Response, NextFunction } from "express";
import { decodeToken } from "../function/token";

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const decoded = decodeToken(token); // Decode the token
    // Attach the decoded user info to req.user
    (req as any).user = {
      _id: decoded._id,
      role: decoded.role,
      is_admin: decoded.is_admin,
    };

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as { role: string[]; is_admin: boolean };

    // If user is an admin, allow access regardless of their roles
    if (user.is_admin) {
      next();
      return;
    }

    if (!user || !user.role.some((role) => allowedRoles.includes(role))) {
      res.status(403).json({
        success: false,
        message:
          "Access denied. You do not have permission to perform this action.",
        data: null,
      });
      return;
    }

    next();
  };
};
