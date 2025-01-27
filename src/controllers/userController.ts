import { decodeToken, getIdFromToken } from './../function/token';
import { Request, Response, NextFunction } from "express";
import { User } from "../models/userModel";
import bcrypt from "bcrypt";
import { UserRequest } from "../types/requests";
import { IUser } from "../types/model/index";
import { handleError } from "../error/errorHandler";
import { generateToken } from "../function/token";
import _ from "lodash";
import { School } from "../models/schoolsModel";
import OTPVerification from "../models/OTPVerifivation";
import { sendEmail } from "../utils/mail";
import { generateOTP } from "../utils";

const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })

export const userProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id = getIdFromToken(req);

    const user = await User.findOne({_id : user_id}).populate(
      "schoolId",
      "schoolName location"
    );
    if (!user) {
      return handleError(res, 400, "Invalid token.");
    }
    // Exclude sensitive fields from response
    const userData = _.omit(user.toObject(), ["password", "pin"]);

    res.status(200).json({
      success: true,
      message: "User profile retrieved in successfully.",
      data: userData,
    });
  } catch (error) {
    next(error);
  }
};


export const updateProfile = async(
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id = getIdFromToken(req);

    const user = await User.findOne({_id : user_id}).populate(
      "schoolId",
      "schoolName location"
    );
    if (!user) {
      return handleError(res, 400, "Invalid token.");
    }

    const updateData = _.omit(req.body, ["profileImage"])

    User.updateOne({_id: user_id}, updateData)
    user.save()
    // Exclude sensitive fields from response
    const userData = _.omit(user.toObject(), ["password", "pin"]);

    res.status(200).json({
      success: true,
      message: "User profile updated in successfully.",
      data: userData,
    });
  } catch (error) {
    next(error);
  }
}