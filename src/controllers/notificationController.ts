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
      if (notifications){
        res.status(200).json({
              success: true,
              message: "Notifications retrieved successfully.",
              data: notifications,
          });
      } else {
          res.status(400).json({
              success: false,
              message: "You have 0 Notifications.",
              data: [],
          });
      }
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

      if (notification){
        res.status(200).json({
              success: true,
              message: "Notification retrieved successfully.",
              data: notification,
          });
      } else {
          res.status(400).json({
              success: false,
              message: "Notification not found.",
              data: null,
          });
      }
    } catch (error) {
      next(error);
    }
  };
  
