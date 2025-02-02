import { Request, Response, NextFunction } from "express";
import { User } from "../models/userModel";
import bcrypt from "bcrypt";
import { UserRequest } from "../types/requests";
import { IUser } from "../types/model/index";
import { handleError } from "../error/errorHandler";
import { generateToken } from "../function/token";
import _ from "lodash";
import { Notification } from "../models/notifications";
import { getIdFromToken } from "../function/token"



export const getUserNotificationss = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      
      const notifications = await Notification.find({user: getIdFromToken(req)});
      res.status(200).json(notifications);
    } catch (error) {
      next(error);
    }
  };

export const getUserSingleNotification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      
      const notification = await Notification.find({user: getIdFromToken(req), _id:req.params.id});
      res.status(200).json(notification);
    } catch (error) {
      next(error);
    }
  };
  
