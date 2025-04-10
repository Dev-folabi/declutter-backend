import { Request } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

interface TokenPayload {
  _id: string;
  role: string[];
  is_admin: boolean;
}
const JWT = process.env.JWT_SECRET_KEY as string;

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT, {
    expiresIn: "1d",
  });
};

export const decodeToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT) as TokenPayload;
  } catch (error) {
    throw new Error("Invalid token");
  }
};

export const getIdFromToken = (req: Request): string => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw new Error("Invalid authorization header format");
    }

    const token = parts[1];
    const decoded = jwt.verify(token, JWT) as TokenPayload;
    return decoded._id;
  } catch (error: any) {
    throw new Error(`Invalid token sent`);
  }
};
