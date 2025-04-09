import { Request, Response, NextFunction } from "express";
import { decodeToken } from "../function/token";


export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = decodeToken(token); 

    // add user to request
    req.body.userId = decoded
    next(); 
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' }); 
  }
};