import { decodeToken, getIdFromToken } from './../function/token';
import { Request, Response, NextFunction } from "express";
import { User } from "../models/userModel";
import bcrypt from "bcrypt";
import { UserRequest } from "../types/requests";
import { IUser } from "../types/model/index";
import { handleError } from "../error/errorHandler";
import _ from "lodash";


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

    const user = await User.findOne({_id : user_id});
    if (!user) {
      return handleError(res, 400, "Invalid token.");
    }

    let hashedPin
    if (req.body.pin) {
        hashedPin = await bcrypt.hash(req.body.pin, 10);
        req.body.pin = hashedPin
    }
    
    await User.updateOne({ _id: user_id }, { $set: req.body });
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

export const changePassword = async(
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id = getIdFromToken(req);

    const user = await User.findOne({_id : user_id});
    if (!user) {
      return handleError(res, 400, "Invalid token.");
    }

    const { old_password, new_password, confirm_password } = req.body;
    
    // console.log(old_password)
    const isValidPassword = await bcrypt.compare(old_password, user.password);
    if (!isValidPassword) {
      return handleError(res, 400, "Invalid email or password.");
    }
    console.log(old_password)

    if (!new_password === confirm_password){
      return handleError(res, 400, "Password doesn't match.");
    }


    const hashedPassword = await bcrypt.hash(new_password, 10);
    let data = {password: hashedPassword}
    await User.updateOne({_id: user_id}, {$set: data})
    user.save()
    // Exclude sensitive fields from response
    const userData = _.omit(user.toObject(), ["password", "pin"]);

    res.status(200).json({
      success: true,
      message: "User password changed in successfully.",
      data: userData,
    });
  } catch (error) {
    next(error);
  }
}