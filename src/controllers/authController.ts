import { Request, Response, NextFunction } from "express";
import { User } from "../models/userModel";
import bcrypt from "bcrypt";
import { UserRequest } from "../types/requests";
import { handleError } from "../error/errorHandler";
import { generateToken } from "../function/token";
import _ from "lodash";
import { School } from "../models/schoolsModel";

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

    // Check if user already exists based on email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return handleError(res, 400, "Email already exists, please login.");
    }

    // Check if NIN exists (if provided)
    if (nin) {
      const existingNin = await User.findOne({ nin });
      if (existingNin) {
        return handleError(res, 400, "NIN already exists, please login.");
      }
    }

    // Hash password and pin
    const hashedPassword = await bcrypt.hash(password, 10);
    let hashedPin;

    if (pin) {
      hashedPin = await bcrypt.hash(pin, 10);
    }

    // Create new user
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      schoolId,
      schoolIdCardURL,
      nin,
      accountName: role === "seller" ? fullName : undefined,
      accountNumber,
      bankCode,
      pin: hashedPin,
      role,
      sellerStatus: role === "seller" ? "pending" : "not enroll",
    });

    const populatedUser = await newUser.populate("schoolId");

    // Generate token
    const token = generateToken({ id: populatedUser.id });

    // Exclude sensitive fields from response
    const userData = _.omit(populatedUser.toObject(), ["password", "pin"]);

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
