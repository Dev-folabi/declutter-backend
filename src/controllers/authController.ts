import { Request, Response, NextFunction } from "express";
import { User } from "../models/userModel";
import bcrypt from "bcrypt";
import { UserRequest } from "../types/requests";
import { handleError } from "../error/errorHandler";
import { generateToken } from "../function/token";
import _ from "lodash";

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
      schoolIdCard,
      nin,
      accountNumber,
      bankCode,
      pin,
      role,
    } = req.body;

    // Validate required fields for seller role
    if (
      role === "seller" &&
      (!schoolIdCard || !nin || !accountNumber || !bankCode || !pin)
    ) {
      return handleError(
        res,
        400,
        "Please complete the form with all required fields."
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { nin }],
    });
    if (existingUser) {
      return handleError(res, 400, "User already exists, please login.");
    }

    // Hash password and pin
    const hashedPassword = await bcrypt.hash(password, 10);
    let hashedPin;

    if (pin) {
      hashedPin = await bcrypt.hash(pin, 10);
    }

    // Create new user
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      schoolId,
      schoolIdCard,
      nin,
      accountName: "", // Initialize as empty
      accountNumber,
      bankCode,
      pin: hashedPin,
      role,
    });

    // Generate token
    const token = generateToken(user.id);

    // Exclude sensitive fields from response
    const userData = _.omit(user.toObject(), ["password", "pin"]);

    res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: userData,
      token,
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
    const user = await User.findOne({ email });
    if (!user) {
      return handleError(res, 400, "Invalid email or password.");
    }

    // Compare passwords
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return handleError(res, 400, "Invalid email or password.");
    }

    // Generate token
    const token = generateToken(user.id);

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

