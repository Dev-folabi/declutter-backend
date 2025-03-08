import { Request, Response, NextFunction } from "express";
import { User } from "../models/userModel";
import bcrypt from "bcrypt";
import axios from "axios";
import { UserRequest } from "../types/requests";
import { IUser } from "../types/model/index";
import { handleError } from "../error/errorHandler";
import { generateToken } from "../function/token";
import _ from "lodash";
import { School } from "../models/schoolsModel";
import OTPVerification from "../models/OTPVerifivation";
import { sendEmail } from "../utils/mail";
import { generateOTP } from "../utils";
import { createNotification } from "./notificationController";
import paystack from "../service/paystack";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE_URL =
  process.env.PAYSTACK_BASE_URL || "https://api.paystack.co";

export const addSchoolsBulk = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const schools = req.body.schools;

    if (!Array.isArray(schools) || schools.length === 0) {
      return handleError(res, 400, "Please provide a valid array of schools.");
    }

    // Filter out duplicate school names from the request body
    const uniqueSchools = Array.from(
      new Set(schools.map((school) => school.schoolName))
    ).map((schoolName) =>
      schools.find((school) => school.schoolName === schoolName)
    );

    // Check for schools that already exist in the database
    const existingSchools = await School.find({
      schoolName: { $in: uniqueSchools.map((school) => school.schoolName) },
    });

    const existingSchoolNames = existingSchools.map(
      (school) => school.schoolName
    );

    // Filter out schools that already exist
    const newSchools = uniqueSchools.filter(
      (school) => !existingSchoolNames.includes(school.schoolName)
    );

    if (newSchools.length === 0) {
      return handleError(
        res,
        400,
        "All provided schools already exist, nothing to add."
      );
    }

    // Add new schools in bulk
    const result = await School.insertMany(newSchools);

    if (!result || result.length === 0) {
      return handleError(res, 400, "Unable to add schools, please try again.");
    }

    // Respond with success and details of added schools
    res.status(200).json({
      success: true,
      message: "Schools added successfully.",
      addedSchools: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getSchools = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const schools = await School.find();
    res.status(200).json(schools);
  } catch (error) {
    next(error);
  }
};

export const registerUser = async (
  req: Request<{}, {}, UserRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      fullName,
      email,
      password,
      schoolId,
      schoolIdCardURL,
      nin,
      accountNumber,
      bankCode,
      pin,
      role,
    } = req.body;

    // Validate required fields for seller role
    if (
      role === "seller" &&
      (!schoolIdCardURL || !nin || !accountNumber || !bankCode || !pin)
    ) {
      return handleError(
        res,
        400,
        "Please complete the form with all required fields."
      );
    }

    // // Check if user already exists based on email
    // const existingUser = await User.findOne({ email });
    // if (existingUser) {
    //   return handleError(res, 400, "Email already exists, please login.");
    // }

    // // Check if NIN exists (if provided)
    // if (nin) {
    //   const existingNin = await User.findOne({ nin });
    //   if (existingNin) {
    //     return handleError(res, 400, "NIN already exists, please login.");
    //   }
    // }

    // Hash password and pin
    const hashedPassword = await bcrypt.hash(password, 10);
    let hashedPin;

    if (pin) {
      hashedPin = await bcrypt.hash(pin, 10);
    }

    const school = await School.findById(schoolId);
    if (!school) {
      return handleError(res, 404, "school not found");
    }

    let account;
    let recipientCode;
    if (role === "seller") {
      const detail = await paystack.createRecipient(
        accountNumber as string,
        bankCode as string
      );
      recipientCode = detail.recipient_code;
      account = detail.details;
    }

    // Create new user
    const newUser: IUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      schoolId,
      schoolIdCardURL,
      nin,
      accountDetail:
        role === "seller"
          ? {
              accountName: account.account_name,
              accountNumber,
              bankCode,
              bankName: account.bank_name,
              recipientCode,
            }
          : undefined,
      pin: hashedPin,
      role,
      sellerStatus: role === "seller" ? "pending" : "not enroll",
      sellerProfileComplete: role === "seller" ? true : undefined,
    });

    const populatedUser = await newUser.populate("schoolId");

    // Generate OTP and expiration timestamp
    const OTP = generateOTP();

    // Upsert OTP entry
    await OTPVerification.updateOne(
      { user: newUser._id, type: "activate account" },
      {
        user: newUser._id,
        OTP,
        type: "activate account",
        verificationType: "email",
      },
      { upsert: true }
    );

    // Send email
    await sendEmail(
      newUser.email,
      "Verify EMail - OTP Verification",
      `
        Hi ${newUser?.fullName.split(" ")[0] || "User"},
        <p>You recently requested to verify your email. Use the OTP below to verify it:</p>
        <h2>${OTP}</h2>
        <p>This OTP is valid for <strong>30 minutes</strong>.</p>
        <p>If you didn’t request this, you can safely ignore this email.</p>
        <br />
      `
    );

    // Generate token // todo: do not login user yet until email is verified
    // const token = generateToken({ id: populatedUser.id });

    // Exclude sensitive fields from response
    const userData = _.omit(populatedUser.toObject(), ["password", "pin"]);

    res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: userData,
      // token,
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return handleError(res, 400, "Email and password are required.");
    }

    // Find user by email
    const user = await User.findOne({ email }).populate(
      "schoolId",
      "schoolName location"
    );
    if (!user) {
      return handleError(res, 400, "Invalid email or password.");
    }

    // Compare passwords
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return handleError(res, 400, "Invalid email or password.");
    }

    // send otp if user is not verified
    if (!user.emailVerified) {
      // Generate OTP and expiration timestamp
      // await requestEmailVerifyOTP(user)

      const OTP = generateOTP();

      // Upsert OTP entry
      await OTPVerification.updateOne(
        { user: user._id, type: "activate account" },
        {
          user: user._id,
          OTP,
          type: "activate account",
          verificationType: "email",
        },
        { upsert: true }
      );

      // Send email
      await sendEmail(
        user.email,
        "Verify e-mail - OTP Verification",
        `
            Hi ${user?.fullName.split(" ")[0] || "User"},
            <p>You recently requested to verify your email. Use the OTP below to verify it:</p>
            <h2>${OTP}</h2>
            <p>This OTP is valid for <strong>30 minutes</strong>.</p>
            <p>If you didn’t request this, you can safely ignore this email.</p>
            <br />
          `
      );
      return handleError(
        res,
        400,
        "Your email has not been verified. Check your email for the otp"
      );
    }

    // Generate token
    const token = generateToken({ id: user.id });

    // Exclude sensitive fields from response
    const userData = _.omit(user.toObject(), ["password", "pin"]);

    res.status(200).json({
      success: true,
      message: "User logged in successfully.",
      data: userData,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { OTP } = req.body;

    if (!OTP) {
      return handleError(res, 400, "OTP is required.");
    }

    const otpVerification = await OTPVerification.findOne({
      OTP,
      type: "activate account",
    });
    if (!otpVerification) {
      return handleError(res, 400, "Invalid OTP.");
    }

    const user = await User.findById(otpVerification.user);
    if (!user) {
      return handleError(res, 404, "User not found.");
    }

    user.emailVerified = true;
    await user.save();

    // Generate token
    const token = generateToken({ id: user.id });

    // Exclude sensitive fields from response
    const userData = _.omit(user.toObject(), ["password", "pin"]);

    res.status(200).json({
      success: true,
      message: "Email verified successful.",
      data: userData,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPasswordOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return handleError(res, 404, "User not found.");
    }

    // Generate OTP and expiration timestamp
    const OTP = generateOTP();

    // Upsert OTP entry
    await OTPVerification.updateOne(
      { user: user._id, type: "password" },
      {
        user: user._id,
        OTP,
        type: "password",
        verificationType: "email",
      },
      { upsert: true }
    );

    // Send email
    await sendEmail(
      user.email,
      "Reset Your Password - OTP Verification",
      `
        Hi ${user?.fullName.split(" ")[0] || "User"},
        <p>You recently requested to reset your password. Use the OTP below to reset it:</p>
        <h2>${OTP}</h2>
        <p>This OTP is valid for <strong>30 minutes</strong>.</p>
        <p>If you didn’t request this, you can safely ignore this email.</p>
        <br />
      `
    );

    res.status(200).json({
      success: true,
      message: "OTP sent to your email.",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { OTP, newPassword } = req.body;

    // Validate input
    if (!OTP || !newPassword) {
      return handleError(res, 400, "OTP and new password are required.");
    }

    // Find and validate OTP entry
    const otpVerification = await OTPVerification.findOne({
      OTP,
      type: "password",
    });
    if (!otpVerification) {
      return handleError(res, 400, "Invalid OTP.");
    }

    // Find user
    const user = await User.findById(otpVerification.user);
    if (!user) {
      return handleError(res, 404, "User not found.");
    }

    // Hash and update password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    const notificationData = {
      user: user._id,
      body: "You password has been changed",
      type: "account",
      title: "Password Change",
    };

    await createNotification(notificationData);
    // Remove OTP entry
    await OTPVerification.deleteOne({ _id: otpVerification._id });

    res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    next(error);
  }
};
