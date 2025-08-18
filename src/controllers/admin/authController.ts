import { Request, Response, NextFunction } from "express";
import { Admin } from "../../models/adminModel";
import { IAdmin } from "../../types/model/index";
import { handleError } from "../../error/errorHandler";
import OTPVerification from "../../models/OTPVerifivation";
import { sendEmail } from "../../utils/mail";
import { generateOTP } from "../../utils";
import { AdminRequest } from "../../types/requests";
import { createNotification } from "../notificationController";
import bcrypt from "bcrypt";
import { generateToken } from "../../function/token";
import _ from "lodash";
import { ADMIN_ONLY_ROLES } from "../../constant";

// signup logic for the admin
export const registerAdmin = async (
  req: Request<{}, {}, AdminRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fullName, email, password, role } = req.body;
    // Basic validation for admin
    if (![...ADMIN_ONLY_ROLES].includes(role)) {
      handleError(
        res,
        400,
        "Invalid role. Must be SUPER_ADMIN or SUPPORT_AGENT"
      );
      return;
    }
    // check if the  admin email is registered
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      handleError(res, 400, "Email already exists, please login.");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create AMIN
    const newAdmin: IAdmin = await Admin.create({
      fullName,
      email,
      password: hashedPassword,
      role,
    });

    // Generate OTP and expiration timestamp
    const OTP = generateOTP();

    // Upsert OTP for this admin
    await OTPVerification.updateOne(
      {
        "owner.id": newAdmin._id,
        "owner.type": "Admin",
        type: "activate account",
      },
      {
        owner: {
          id: newAdmin._id,
          type: "Admin",
        },
        OTP,
        type: "activate account",
        verificationType: "email",
      },
      { upsert: true }
    );

    // Send OTP email
    const firstName = fullName.split(" ")[0];
    await sendEmail(
      email,
      "Verify Your Email - Admin Registration",
      `
        <p>Hi ${firstName},</p>
        <p>You successfully registered as an admin. Please use the OTP below to activate your account:</p>
        <h2>${OTP}</h2>
        <p>This OTP is valid for <strong>30 minutes</strong>.</p>
        <p>If you didn’t request this, please ignore this email.</p>
        <br/>
      `
    );

    // Send success response
    res.status(201).json({
      success: true,
      message: "Admin registered successfully. OTP sent to email.",
      data: newAdmin,
    });
  } catch (error: any) {
    console.error("Admin registration error:", error);
    handleError(res, 500, "Something went wrong during registration.");
    return;
  }
};

// login admin

export const loginAdmin = async (
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
    //  find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      handleError(res, 404, "Admin not found");
      return;
    }
    // Compare passwords
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      handleError(res, 401, "Invalid credentials");
      return;
    }

    // send otp if admin is not verified
    if (!admin.emailVerified) {
      // Generate OTP and expiration timestamp
      // await requestEmailVerifyOTP(user)
      console.log("Login endpoint hit:", req.body);

      const OTP = generateOTP();

      // Upsert OTP entry
      await OTPVerification.updateOne(
        {
          "owner.id": admin._id,
          "owner.type": "Admin",
          type: "activate account",
          verificationType: "email",
        },
        {
          $set: {
            OTP,
            type: "activate account",
            verificationType: "email",
            owner: {
              id: admin._id,
              type: "Admin",
            },
          },
        },
        { upsert: true }
      );

      // Send email
      await sendEmail(
        admin.email,
        "Verify e-mail - OTP Verification",
        `
            Hi ${admin?.fullName.split(" ")[0] || "Admin"},
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
    const token = generateToken({
      _id: admin.id,
      role: [admin.role],
      is_admin: true,
    });

    // Exclude sensitive fields from response
    const adminData = _.omit(admin.toObject(), ["password"]);
    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: adminData,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// verify admin email
export const verifyAdminEmail = async (
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

    const admin = await Admin.findById(otpVerification.owner?.id);
    if (!admin) {
      return handleError(res, 404, "Admin not found.");
    }

    admin.emailVerified = true;
    await admin.save();

    // Generate token
    const token = generateToken({
      _id: admin.id,
      role: [admin.role],
      is_admin: true,
    });

    // Exclude sensitive fields from response
    const adminData = _.omit(admin.toObject(), ["password"]);

    res.status(200).json({
      success: true,
      message: "Email verified successful.",
      data: adminData,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// reset admin password OTP
export const resetAdminPasswordOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    // Find user by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return handleError(res, 404, "Admin not found.");
    }

    // Generate OTP and expiration timestamp
    const OTP = generateOTP();

    // Upsert OTP entry
    await OTPVerification.updateOne(
      {
        "owner.id": admin._id,
        "owner.type": "Admin",
        type: "password",
        verificationType: "email",
      },
      {
        $set: {
          OTP,
          type: "password",
          verificationType: "email",
          owner: {
            id: admin._id,
            type: "Admin",
          },
        },
      },
      { upsert: true }
    );

    // Send email
    await sendEmail(
      admin.email,
      "Reset Your Password - OTP Verification",
      `
        Hi ${admin?.fullName.split(" ")[0] || "Admin"},
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

// reset admin password
export const resetAdminPassword = async (
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
      "owner.type": "Admin",
      verificationType: "email",
    });
    if (!otpVerification) {
      return handleError(res, 400, "Invalid OTP.");
    }

    // Find admin
    const admin = await Admin.findById(otpVerification.owner?.id);
    if (!admin) {
      return handleError(res, 404, "Admin not found.");
    }

    // Hash and update password
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    const notificationData = {
      recipient: admin._id,
      recipientModel: "Admin",
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
