import { decodeToken, getIdFromToken } from "./../function/token";
import { Request, Response, NextFunction } from "express";
import { User } from "../models/userModel";
import bcrypt from "bcrypt";
import { UserRequest } from "../types/requests";
import { IUser } from "../types/model/index";
import { handleError } from "../error/errorHandler";
import _ from "lodash";
import { createNotification } from "./notificationController";
import { sendEmail } from "../utils/mail";
import OTPVerification from "../models/OTPVerifivation";
import { generateOTP, decryptAccountDetail, encryptData } from "../utils";
import paystack from "../service/paystack";
import { uploadToImageKit } from "../utils/imagekit";

export const userProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id = getIdFromToken(req);

    const user = await User.findOne({ _id: user_id }).populate(
      "schoolId",
      "schoolName location"
    );
    if (!user) {
      return handleError(res, 400, "unauthorized.");
    }
    // Exclude sensitive fields from response
    const userData = _.omit(user.toObject(), ["password", "pin"]);

    // to make sure existing implementations doesnt break
    try {
      if (userData.accountDetail) {
        userData.accountDetail = decryptAccountDetail(userData.accountDetail);
      }
    } catch (e) {
      /* to make sure existing codes doesnt break */
    }

    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully.",
      data: userData,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id = getIdFromToken(req);
    const { fullName, email, currentPassword } = req.body;
    const file = req.file;

    const user = await User.findById(user_id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
      });
      return;
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      res.status(400).json({
        success: false,
        message: "Current password is incorrect",
        data: null,
      });
      return;
    }

    let updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;

    // Handle profile image upload
    if (file) {
      const uploadResult = await uploadToImageKit({
        file: file.buffer,
        fileName: file.originalname,
        folder: '/profiles',
        tags: ['profile', 'user'],
      });
      updateData.profileImageURL = uploadResult.url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      user_id,
      { $set: updateData },
      { new: true }
    );

    const notificationData = {
      recipient: user_id,
      recipientModel: "User",
      body: "Your profile has been updated",
      type: "account",
      title: "Profile update",
    };

    await createNotification(notificationData);
    
    // Exclude sensitive fields from response
    const userData = _.omit(updatedUser?.toObject(), ["password", "pin"]);

    try {
      if (userData.accountDetail) {
        userData.accountDetail = decryptAccountDetail(userData.accountDetail);
      }
    } catch (e) {
      /* to make sure existing codes doesnt break */
    }

    await sendEmail(
      user.email,
      "Profile update Email",
      `
        Hi ${user?.fullName.split(" ")[0] || "User"},
        <p>You have updated your profile successfully</p>
       
        <p>If you didn't perform this action, Please reach out to an admin promptly.</p>
        <br />
      `
    );

    res.status(200).json({
      success: true,
      message: "User profile updated successfully.",
      data: userData,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBankDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id = getIdFromToken(req);

    const user = await User.findOne({ _id: user_id });
    if (!user) {
      return handleError(res, 400, "unauthorized.");
    }

    const {
      withdrawalPin,
      currentPassword,
      accountName,
      accountNumber,
      bankCode,
    } = req.body;

    const isValidPin = await bcrypt.compare(withdrawalPin, user.pin);
    if (!isValidPin) {
      return handleError(res, 400, "Invalid pin.");
    }

    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isValidPassword) {
      return handleError(res, 400, "Invalid password.");
    }

    // const otp = OTPisValid(OTP, action, user)
    // if (!otp) {
    //   return handleError(res, 400, "Invalid OTP.");
    // }

    const detail = await paystack.createRecipient(
      accountNumber as string,
      bankCode as string
    );
    const recipientCode = detail.recipient_code;
    const account = detail.details;

    const encryptedAccountNumber = encryptData(accountNumber);
    const encryptedbankCode = encryptData(bankCode);
    const encryptedRecipientCode = encryptData(recipientCode);
    const encryptedBankName = encryptData(account.bank_name);

    const accountDetail = {
      accountName: account.account_name,
      accountNumber: encryptedAccountNumber,
      bankCode: encryptedbankCode,
      bankName: encryptedBankName,
      recipientCode: encryptedRecipientCode,
    };

    await User.updateOne(
      { _id: user_id },
      { accountDetail },
      { new: true, upsert: true }
    );
    user.save();

    const notificationData = {
      recipient: user_id,
      recipientModel: "User",
      body: "Your bank details have been updated",
      type: "account",
      title: "Bank update",
    };

    await createNotification(notificationData);
    // Exclude sensitive fields from response
    const userData = _.omit(user.toObject(), ["password", "pin"]);

    // Decrypt fields in response
    try {
      if (userData.accountDetail) {
        userData.accountDetail = decryptAccountDetail(userData.accountDetail);
      }
    } catch (e) {
      /* to make sure existing codes doesnt break */
    }

    await sendEmail(
      user.email,
      "Bank Details Updated",
      `
        Hi ${user?.fullName.split(" ")[0] || "User"},
        <p>You have updated your bank details successfully</p>
       
        <p>If you didn’t perform this action, Please reach out to an admin promptly.</p>
        <br />
      `
    );
    res.status(200).json({
      success: true,
      message: "User profile updated in successfully.",
      data: userData,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id = getIdFromToken(req);

    const user = await User.findOne({ _id: user_id });
    if (!user) {
      return handleError(res, 400, "unauthorized.");
    }

    const { withdrawalPin, currentPassword, new_pin, confirm_pin } = req.body;

    const isValidPin = await bcrypt.compare(withdrawalPin, user.pin);
    if (!isValidPin) {
      return handleError(res, 400, "Invalid pin.");
    }

    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isValidPassword) {
      return handleError(res, 400, "Invalid password.");
    }

    if (!(new_pin === confirm_pin)) {
      return handleError(res, 400, "Pin doesn't match.");
    }

    const hashedPin = await bcrypt.hash(new_pin, 10);
    let data = { pin: hashedPin };

    await User.updateOne(
      { _id: user_id },
      { $set: data },
      { new: true, runValidators: true }
    );
    user.save();

    const notificationData = {
      recipient: user_id,
      recipientModel: "User",
      body: "Your pin has been changed",
      type: "account",
      title: "Pin update",
    };

    await createNotification(notificationData);
    // Exclude sensitive fields from response
    const userData = _.omit(user.toObject(), ["password", "pin"]);

    try {
      if (userData.accountDetail) {
        userData.accountDetail = decryptAccountDetail(userData.accountDetail);
      }
    } catch (e) {
      /* to make sure existing codes doesnt break */
    }

    await sendEmail(
      user.email,
      "Pin Change Email",
      `
        Hi ${user?.fullName.split(" ")[0] || "User"},
        <p>You have changed your pin successfully</p>
       
        <p>If you didn’t perform this action, Please reach out to an admin promptly.</p>
        <br />
      `
    );
    res.status(200).json({
      success: true,
      message: "User profile updated in successfully.",
      data: userData,
    });
  } catch (error) {
    next(error);
  }
};

const OTPisValid = async (OTP: String, type: String, user: IUser) => {
  const otpVerification = await OTPVerification.findOne({
    OTP,
    type,
    user,
  });
  return otpVerification;
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_id = getIdFromToken(req);

    const user = await User.findOne({ _id: user_id });
    if (!user) {
      return handleError(res, 400, "unauthorized.");
    }

    const { old_password, new_password, confirm_password } = req.body;

    const isValidPassword = await bcrypt.compare(old_password, user.password);
    if (!isValidPassword) {
      return handleError(res, 400, "Invalid email or password.");
    }

    if (!(new_password === confirm_password)) {
      return handleError(res, 400, "Password doesn't match.");
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    let data = { password: hashedPassword };
    await User.updateOne(
      { _id: user_id },
      { $set: data },
      { new: true, runValidators: true }
    );
    user.save();

    const notificationData = {
      user: user_id,
      body: "Your password has beeen changed",
      type: "account",
      title: "Password change",
    };

    await createNotification(notificationData);
    // Exclude sensitive fields from response
    const userData = _.omit(user.toObject(), ["password", "pin"]);

    try {
      if (userData.accountDetail) {
        userData.accountDetail = decryptAccountDetail(userData.accountDetail);
      }
    } catch (e) {
      /* to make sure existing codes doesnt break */
    }

    await sendEmail(
      user.email,
      "Password Change Email",
      `
        Hi ${user?.fullName.split(" ")[0] || "User"},
        <p>You have changed your password successfully</p>
       
        <p>If you didn’t perform this action, Please reach out to an admin promptly.</p>
        <br />
      `
    );
    res.status(200).json({
      success: true,
      message: "User password changed in successfully.",
      data: userData,
    });
  } catch (error) {
    next(error);
  }
};

export const requestOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { reason, type } = req.body;
  const user_id = getIdFromToken(req);

  const user = await User.findOne({ _id: user_id });
  if (!user) {
    return handleError(res, 400, "unauthorized.");
  }
  const OTP = generateOTP();
  // Upsert OTP entry

  await OTPVerification.updateOne(
    { user: user._id, type: type },
    {
      user: user._id,
      OTP,
      type: type,
      verificationType: "email",
    },
    { upsert: true }
  );

  // Send email
  await sendEmail(
    user.email,
    "Verify EMail - OTP Verification",
    `
      Hi ${user?.fullName.split(" ")[0] || "User"},
      <p>You recently requested to ${reason}. Use the OTP below:</p>
      <h2>${OTP}</h2>
      <p>This OTP is valid for <strong>30 minutes</strong>.</p>
      <p>If you didn’t request this, you can safely ignore this email.</p>
      <br />
    `
  );
};
