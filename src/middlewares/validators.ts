import { Request, Response, NextFunction } from "express";
import { body, check, validationResult } from "express-validator";
import isURL from "validator/lib/isURL";

const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: errors.array()[0].msg || "Invalid data sent",
      errors: errors.array(),
    });
    return;
  }
  next();
};

export const validateWaitlist = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address"),
  handleValidationErrors,
];

export const validateAddSchoolsBulk = [
  body("schools")
    .isArray({ min: 1 })
    .withMessage("Schools must be an array with at least one entry."),
  body("schools.*.schoolName")
    .notEmpty()
    .withMessage("School Name is required for each school.")
    .isString()
    .withMessage("School Name must be a string."),
  body("schools.*.location")
    .notEmpty()
    .withMessage("Location is required for each school.")
    .isString()
    .withMessage("Location must be a string."),
  handleValidationErrors,
];

export const validateRegister = [
  body("fullName").notEmpty().withMessage("Full name is required"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isStrongPassword()
    .withMessage("Password must be 8 characters containing atleast a special character, a number, an uppercase and lowercase letter")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("schoolId").notEmpty().withMessage("School ID is required"),
  body("schoolIdCardURL")
    .optional()
    .isURL()
    .withMessage("School ID Card must be a url"),
  body("nin")
    .optional()
    .isString()
    .withMessage("NIN must be a string")
    .isLength({ min: 11 })
    .withMessage("NIN must be 11 characters long"),
  body("accountNumber")
    .optional()
    .isString()
    .withMessage("Account Number must be a string")
    .isLength({ min: 10 })
    .withMessage("Account Number must be 11 characters long"),
  body("bankCode")
    .optional()
    .isString()
    .withMessage("Bank Code must be a string"),
  body("pin").optional().isString().withMessage("PIN must be a string"),
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["seller", "buyer"])
    .withMessage("Invalid role. Role must be either 'seller' or 'buyer'")
    .isString()
    .withMessage("Role must be a string"),
  handleValidationErrors,
];

export const validateProfileUpdate = [
  body("fullName").notEmpty().withMessage("Full name is required"),
  body("accountNumber")
    .optional()
    .isString()
    .withMessage("Account Number must be a string")
    .isLength({ min: 10 })
    .withMessage("Account Number must be 10 characters long"),
  body("bankCode")
    .optional()
    .isString()
    .withMessage("Bank Code must be a string"),
  body("pin").optional().isString().withMessage("PIN must be a string"),
  handleValidationErrors,
];

export const validateLogin = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isString()
    .withMessage("Password must be string"),
  handleValidationErrors,
];

export const validateChangePassword = [
  body("old_password")
    .notEmpty()
    .withMessage("Old password is required")
    .isString()
    .withMessage("Password must be string"),
  body("new_password")
    .notEmpty()
    .withMessage("Password is required")
    .isString()
    .withMessage("Password must be string"),
  body("confirm_password")
    .notEmpty()
    .withMessage("Password is required")
    .isString()
    .withMessage("Password must be string"),
  handleValidationErrors,
];

export const validateResetPasswordOTP = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address"),
  handleValidationErrors,
];

export const validateVerifyEmailOTP = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address"),
  body("OTP")
    .notEmpty()
    .withMessage("OTP is required")
    .isString()
    .withMessage("OTP must be string"),
  handleValidationErrors,
];

export const validateResetPassword = [
  body("OTP")
    .notEmpty()
    .withMessage("OTP is required")
    .isString()
    .withMessage("OTP must be a string"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isString()
    .withMessage("New password must be a string")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long"),
  handleValidationErrors,
];



export const validateProductListing = [
  body("name").notEmpty().withMessage("Product name is required"),
  body("price")
    .isNumeric()
    .withMessage("Price must be a number")
    .notEmpty()
    .withMessage("Price is required"),
  body("category")
    .notEmpty()
    .withMessage("Product category is required")
    .isIn(['electronics', 'books & stationery', 'clothing & accessories', 'furniture', 'home & kitchen', 'sports & fitness equipment', 'gaming & entertainment', 'health & personal care', 'hobbies & crafts', 'miscellaneous'])
    .withMessage("Invalid category. Category must be among "),
  body("location")
    .isString().withMessage("Product location must be string")
    .notEmpty().withMessage("Product location is required")
    .withMessage("location must be a string"),
  body("description")
    .isString()
    .notEmpty().withMessage("Product description is required")
    .withMessage("description must be a string"),
  handleValidationErrors,
];
