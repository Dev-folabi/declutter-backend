import { Request, Response, NextFunction } from "express";
import { User } from "../models/userModel";
import bcrypt from "bcrypt";
import { UserRequest } from "../types/requests";
import { CreateNotificationData, IUser } from "../types/model/index";
import { handleError } from "../error/errorHandler";
import { generateToken } from "../function/token";
import _ from "lodash";
import { School } from "../models/schoolsModel";
import OTPVerification from "../models/OTPVerifivation";
import { sendEmail } from "../utils/mail";
import {
  decryptAccountDetail,
  decryptData,
  encryptData,
  generateOTP,
} from "../utils";
import { createNotification } from "./notificationController";
import paystack from "../service/paystack";
import { uploadToImageKit } from "../utils/imagekit";

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

export const resendVerificationOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return handleError(res, 400, "Email is required.");
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return handleError(res, 404, "User not found.");
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return handleError(res, 400, "Email is already verified.");
    }

    // Generate a new OTP
    const OTP = generateOTP();

    // Upsert OTP entry
    await OTPVerification.updateOne(
      {
        "owner.id": user._id,
        "owner.type": "User",
        type: "activate account",
        verificationType: "email",
      },
      {
        $set: {
          OTP,
          type: "activate account",
          verificationType: "email",
          owner: {
            id: user._id,
            type: "User",
          },
        },
      },
      { upsert: true }
    );

    // Send email
    await sendEmail(
      user.email,
      "Verify Your Email - New OTP",
      `
        Hi ${user?.fullName.split(" ")[0] || "User"},
        <p>You requested a new OTP to verify your email. Use the OTP below:</p>
        <h2>${OTP}</h2>
        <p>This OTP is valid for <strong>30 minutes</strong>.</p>
        <p>If you didn’t request this, you can safely ignore this email.</p>
        <br />
      `
    );

    res.status(200).json({
      success: true,
      message: "A new OTP has been sent to your email.",
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
      accountNumber,
      bankCode,
      pin,
      role,
    } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let schoolIdCardURL: string | undefined;
    let ninURL: string | undefined;

    if (role === "seller") {
      const schoolIdCardFile = files?.schoolIdCard?.[0];
      const ninFile = files?.nin?.[0];

      if (!schoolIdCardFile || !ninFile) {
        return handleError(
          res,
          400,
          "Please provide both school ID card and NIN for seller registration."
        );
      }

      try {
        const schoolIdUpload = uploadToImageKit({
          file: schoolIdCardFile.buffer,
          fileName: schoolIdCardFile.originalname,
          folder: "school-id-cards",
        });

        const ninUpload = uploadToImageKit({
          file: ninFile.buffer,
          fileName: ninFile.originalname,
          folder: "nin",
        });

        const [schoolIdResult, ninResult] = await Promise.all([
          schoolIdUpload,
          ninUpload,
        ]);

        schoolIdCardURL = schoolIdResult.url;
        ninURL = ninResult.url;
      } catch (uploadError) {
        return handleError(
          res,
          400,
          "Failed to upload documents. Please try again."
        );
      }
    }

    // Check if user already exists based on email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return handleError(res, 400, "Email already exists, please login.");
    }

    // Hash password and pin
    const hashedPassword = await bcrypt.hash(password, 10);
    let hashedPin;

    if (pin) {
      hashedPin = await bcrypt.hash(pin, 10);
    }

    const school = await School.findById(schoolId);
    if (!school) {
      return handleError(res, 404, "School not found");
    }

    let account;
    let encryptedAccountNumber;
    let encryptedbankCode;
    let encryptedBankName;
    let encryptedRecipientCode;

    let recipientCode;
    if (role === "seller" && accountNumber && bankCode) {
      const detail = await paystack.createRecipient(
        accountNumber as string,
        bankCode as string
      );
      recipientCode = detail.recipient_code;
      account = detail.details;

      encryptedAccountNumber = encryptData(accountNumber);
      encryptedbankCode = encryptData(bankCode);
      encryptedRecipientCode = encryptData(recipientCode);
      encryptedBankName = encryptData(account.bank_name);
    }

    // Create new user
    const newUser: IUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      schoolId,
      schoolIdCardURL,
      ninURL,
      accountDetail:
        role === "seller" && accountNumber && bankCode
          ? {
              accountName: account.account_name,
              accountNumber: encryptedAccountNumber,
              bankCode: encryptedbankCode,
              bankName: encryptedBankName,
              recipientCode: encryptedRecipientCode,
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
      {
        "owner.id": newUser._id,
        "owner.type": "User",
        type: "activate account",
      },
      {
        owner: {
          id: newUser._id,
          type: "User",
        },
        OTP,
        type: "activate account",
        verificationType: "email",
      },
      { upsert: true }
    );

    // Send email
    await sendEmail(
      newUser.email,
      "Verify Email - OTP Verification",
      `
        Hi ${newUser?.fullName.split(" ")[0] || "User"},
        <p>You recently requested to verify your email. Use the OTP below to verify it:</p>
        <h2>${OTP}</h2>
        <p>This OTP is valid for <strong>30 minutes</strong>.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <br />
      `
    );

    // Exclude sensitive fields from response
    const userData = _.omit(populatedUser.toObject(), ["password", "pin"]);

    try {
      if (userData.accountDetail) {
        decryptAccountDetail(userData.accountDetail);
      }
    } catch (e) {
      /* to make sure existing codes doesn't break */
    }

    res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: userData,
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
      const OTP = generateOTP();

      // Upsert OTP entry
      await OTPVerification.updateOne(
        {
          "owner.id": user._id,
          "owner.type": "User",
          type: "activate account",
          verificationType: "email",
        },
        {
          $set: {
            OTP,
            type: "activate account",
            verificationType: "email",
            owner: {
              id: user._id,
              type: "User",
            },
          },
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

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken({
      _id: user.id,
      role: user.role,
      is_admin: user.is_admin,
    });

    // Exclude sensitive fields from response
    const userData = _.omit(user.toObject(), ["password", "pin"]);

    if (userData.accountDetail) {
      userData.accountDetail = decryptAccountDetail(userData.accountDetail);
    }

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

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { OTP } = req.body;

    if (!OTP) {
      return handleError(res, 400, "OTP is required.");
    }

    // Find OTP and linked user in one go
    const otpVerification = await OTPVerification.findOne({
      OTP: OTP.trim(),
      type: "activate account",
      "owner.type": "User"
    });

    if (!otpVerification) {
      return handleError(res, 400, "Invalid or expired OTP.");
    }

    const user = await User.findById(otpVerification.owner.id);
    if (!user) {
      return handleError(res, 404, "User not found.");
    }

    if (user.emailVerified) {
      return handleError(res, 400, "Email already verified.");
    }

    user.emailVerified = true;
    await user.save();

    await sendEmail(
      user.email,
      "🎉 Welcome to DeclutMart — You're a DeclutStar!",
      `
      <h1>Hey DeclutStar,</h1>
      <p>Welcome to the decluttering community!</p>

      
      <p>As part of DeclutMart users, you are now officially a <strong>DeclutStar 🎉</strong> and you will have the opportunity to declutter, buy and sell used items.</p>

      <p>Here's what you can do to get ready:</p>
        <ul>
          <li>Gather those items you've been meaning to sell — it's time to give them a second home.</li>
          <li>Get ready to explore a community of students buying and selling smartly.</li>
          <li>Spread the word — invite your friends to join the movement and become fellow DeclutStars!</li>
        </ul>
     
      `
    )

    // Remove OTP after success
    await OTPVerification.deleteOne({ _id: otpVerification._id });

    // Generate token
    const token = generateToken({
      _id: user.id,
      role: user.role,
      is_admin: user.is_admin,
    });

    const userData = _.omit(user.toObject(), ["password", "pin"]);

    res.status(200).json({
      success: true,
      message: "Email verified successfully.",
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
      {
        "owner.id": user._id,
        "owner.type": "User",
        type: "password",
        verificationType: "email",
      },
      {
        $set: {
          OTP,
          type: "password",
          verificationType: "email",
          owner: {
            id: user._id,
            type: "User",
          },
        },
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
      "owner.type": "User",
      verificationType: "email",
    });
    if (!otpVerification) {
      return handleError(res, 400, "Invalid OTP.");
    }

    const userId = otpVerification.owner?.id;
    if (!userId) {
      return handleError(res, 400, "User ID not found in OTP record.");
    }

    // Find user
    const user = await User.findById(otpVerification.owner?.id);
    if (!user) {
      return handleError(res, 404, "User not found.");
    }

    // Hash and update password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    try {
      const notificationData: CreateNotificationData = {
        recipient: user._id as string,
        recipientModel: "User" as const,
        body: "Your password has been changed successfully",
        type: "account",
        title: "Password Change Notification",
      };
      await createNotification(notificationData);
    } catch (error) {
      // Continue execution even if notification fails
      console.error('Failed to send password change notification:', error);
    }
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
