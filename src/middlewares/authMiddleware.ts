import { Request, Response, NextFunction } from "express";
import { decodeToken } from "../function/token";
import dotenv from "dotenv";
import { getEnvironment } from "../function/environment";

dotenv.config();

const environment = getEnvironment();

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
    (req as any).admin = {
      _id: decoded._id,
      role: decoded.role,
      is_admin: decoded.is_admin
    }
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
    if (user.role.includes("super_admin")) {
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

export const blockBotsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const userAgent = req.get("User-Agent") || "";

  if (
    ["production", "staging"].includes(environment) &&
    /bot|crawler|spider|scraper|internet|^-$|\s-\s|selenium|phantom|headless|wget|curl|request|python|java|node(?!-fetch)|ruby|perl|go|rust|php/i.test(
      userAgent
    )
  ) {
    // eslint-disable-next-line
    console.log(
      `Suspicious User-Agent blocked: ${userAgent} from IP: ${req.ip}`
    );
    res.status(403).json({
      success: false,
      message: "Access denied",
    });
    return;
  }

  next();
};