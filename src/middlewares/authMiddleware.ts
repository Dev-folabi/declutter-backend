import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT = process.env.JWT_SECRET_KEY as string;

module.exports = function (req: Request, res: Response, next: NextFunction) {
    const token = req.header('Authorization');
    if (!token) return res.status(401).send('Access denied. No token provided.');

    try {
        const decoded_token = jwt.verify(token, JWT); // save with config
        req.body["user"] = decoded_token
        next();
    } catch (ex) {
        res.status(400).send("Invalid token.")
    }
}
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT); 

    // add user to request
    next(); 
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' }); 
  }
};