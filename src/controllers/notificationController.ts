import { Request, Response, NextFunction } from "express";
import { Notification } from "../models/notifications";
import { getIdFromToken } from "../function/token";

export const createNotification = async (data: any) => {
  await Notification.create({
    ...data,
  });
};

export const getUserNotificationss = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const notifications = await Notification.find({
      user: getIdFromToken(req),
    });
    if (notifications.length > 0) {
      res.status(200).json({
        success: true,
        message: "Notifications retrieved successfully.",
        data: notifications,
      });
    } else {
      res.status(200).json({
        success: true,
        message: "No notifications found.",
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
    let notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $set: { is_opened: true } },
      { new: true, runValidators: true }
    );

    if (notification) {
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
