import { Request, Response, NextFunction } from "express";
import { body, check, param, validationResult } from "express-validator";

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

export const validateBankUpdate = [
  body("accountNumber")
    .notEmpty()
    .withMessage("Account Number must be provided")
    .isString()
    .withMessage("Account Number must be a string"),
  body("bankCode")
    .notEmpty()
    .withMessage("Bank code must be provided")
    .isString()
    .withMessage("Bank code must be a string"),
  body("currentPassword")
    .notEmpty()
    .withMessage("Curent Password must be provided")
    .isString()
    .withMessage("Curent Password must be a string"),
  body("withdrawalPin")
    .notEmpty()
    .withMessage("Pin must be provided")
    .isString()
    .withMessage("Pin must be a string"),
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

export const validateChangePin = [
  body("currentPassword")
    .notEmpty()
    .withMessage("currentPassword is required")
    .isString()
    .withMessage("currentPassword must be string"),
  body("withdrawalPin")
    .notEmpty()
    .withMessage("withdrawalPin is required")
    .isString()
    .withMessage("withdrawalPin must be string"),
  body("new_pin")
    .notEmpty()
    .withMessage("pin is required")
    .isString()
    .withMessage("pin must be string"),
  body("confirm_pin")
    .notEmpty()
    .withMessage("pin is required")
    .isString()
    .withMessage("pin must be string"),
  handleValidationErrors,
];

export const validateRequestOtp = [
  body("reason")
    .notEmpty()
    .withMessage("Reason is required")
    .isString()
    .withMessage("Password must be string"),
  body("type")
    .notEmpty()
    .withMessage("Type is required")
    .isString()
    .withMessage("Password must be string")
    .isIn(["password", "transaction pin", "activate account", "edit profile"])
    .withMessage("Yype must be among "),
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
    .isIn([
      "electronics",
      "books & stationery",
      "clothing & accessories",
      "furniture",
      "home & kitchen",
      "sports & fitness equipment",
      "gaming & entertainment",
      "health & personal care",
      "hobbies & crafts",
      "miscellaneous",
    ])
    .withMessage("electronics must be a string"),
  body("location")
    .isString()
    .withMessage("Product location must be string")
    .notEmpty()
    .withMessage("Product location is required")
    .withMessage("location must be a string"),
  body("productImage")
    .isArray()
    .withMessage("Product images must be an array")
    .notEmpty()
    .withMessage("At least three product images are required.")
    .isArray({ min: 3 })
    .withMessage("At least three product images are required."),
  body("description")
    .isString()
    .notEmpty()
    .withMessage("Product description is required")
    .withMessage("description must be a string"),
  handleValidationErrors,
];

export const validateProductUpdate = [
  check("name")
    .if((value, { req }) => req.body.name)
    .notEmpty()
    .withMessage("Product name cannot be empty"),

  check("price")
    .if((value, { req }) => req.body.price)
    .isNumeric()
    .withMessage("Price must be a number")
    .notEmpty()
    .withMessage("Price cannot be empty"),

  check("category")
    .if((value, { req }) => req.body.category)
    .isIn([
      "electronics",
      "books & stationery",
      "clothing & accessories",
      "furniture",
      "home & kitchen",
      "sports & fitness equipment",
      "gaming & entertainment",
      "health & personal care",
      "hobbies & crafts",
      "miscellaneous",
    ])
    .withMessage("Invalid category. Must be among the predefined list."),

  check("location")
    .if((value, { req }) => req.body.location)
    .isString()
    .withMessage("Product location must be a string")
    .notEmpty()
    .withMessage("Location cannot be empty"),

  check("description")
    .if((value, { req }) => req.body.description)
    .isString()
    .withMessage("Description must be a string")
    .notEmpty()
    .withMessage("Description cannot be empty"),

  check("productImage")
    .if((value, { req }) => req.body.productImage)
    .isArray()
    .withMessage("Product images must be an array")
    .notEmpty()
    .withMessage("At least one product image is required"),

  handleValidationErrors,
];

export const validateAdminRegister = [
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
    .withMessage(
      "Password must be 8 characters containing atleast a special character, a number, an uppercase and lowercase letter"
    )
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["super_admin", "admin", "support_agent"])
    .withMessage(
      "Invalid role. Role must be either 'super_admin', 'admin', or 'support_agent'"
    )
    .isString()
    .withMessage("Role must be a string"),
  handleValidationErrors,
];

// Middleware to validate the request body for verifying user doc
export const validateVerificationRequest = [
  param("userId")
    .notEmpty()
    .withMessage("User Id is required")
    .isMongoId()
    .withMessage("Invalid user Id format"),

  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["verified", "rejected"])
    .withMessage('Status must be either "verified" or "rejected".'),

  body("comment").optional().isString().withMessage("Comment is required."),
  handleValidationErrors,
];
// middleware to validate request body for updating user status
export const validateStatusUpdate = [
  param("userId")
    .notEmpty()
    .withMessage("User Id is required")
    .isMongoId()
    .withMessage("Invalid user Id format"),

  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["active", "inactive", "suspended"])
    .withMessage('Status must be one of "active", "inactive", or "suspended"'),

  handleValidationErrors,
];

// for validating product moderation requests
export const validateModeration = [
  param("id")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),

  body("isApproved")
    .notEmpty()
    .withMessage("Approval status is required")
    .isBoolean()
    .withMessage("isApproved must be a boolean"),
  handleValidationErrors,
];

export const validateFlagOrRemove = [
  param("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),

  body("action")
    .notEmpty()
    .withMessage("Action is required")
    .isIn(["flag", "remove"])
    .withMessage('Action must be either "flag" or "remove"'),
  handleValidationErrors,
];

export const validateTransactionId = [
  param("transactionId")
    .notEmpty()
    .withMessage("Transaction ID is required")
    .isMongoId()
    .withMessage("Invalid transaction ID format"),
  body("action")
    .notEmpty()
    .withMessage("Action is required")
    .isIn(["approve", "reject"])
    .withMessage('Action must be either "approve" or "reject"'),
  handleValidationErrors,
];

// Support Ticket Validation Functions
export const validateCreateProduct = [
  body("name")
    .notEmpty()
    .withMessage("Product name is required")
    .isString()
    .withMessage("Product name must be a string"),
  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isNumeric()
    .withMessage("Price must be a number"),
  body("location")
    .notEmpty()
    .withMessage("Location is required")
    .isString()
    .withMessage("Location must be a string"),
  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .isString()
    .withMessage("Description must be a string"),
  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn([
      "electronics",
      "books & stationery",
      "clothing & accessories",
      "furniture",
      "home & kitchen",
      "sports & fitness equipment",
      "gaming & entertainment",
      "health & personal care",
      "hobbies & crafts",
      "miscellaneous",
    ])
    .withMessage("Invalid category"),
  handleValidationErrors,
];

export const validateUpdateProduct = [
  param("id")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID format"),

  check("name")
    .if((value, { req }) => req.body.name)
    .notEmpty()
    .withMessage("Product name cannot be empty")
    .isString()
    .withMessage("Product name must be a string"),

  check("price")
    .if((value, { req }) => req.body.price)
    .isNumeric()
    .withMessage("Price must be a number")
    .notEmpty()
    .withMessage("Price cannot be empty"),

  check("category")
    .if((value, { req }) => req.body.category)
    .isIn([
      "electronics",
      "books & stationery",
      "clothing & accessories",
      "furniture",
      "home & kitchen",
      "sports & fitness equipment",
      "gaming & entertainment",
      "health & personal care",
      "hobbies & crafts",
      "miscellaneous",
    ])
    .withMessage("Invalid category. Must be among the predefined list."),

  check("location")
    .if((value, { req }) => req.body.location)
    .isString()
    .withMessage("Product location must be a string")
    .notEmpty()
    .withMessage("Location cannot be empty"),

  check("description")
    .if((value, { req }) => req.body.description)
    .isString()
    .withMessage("Description must be a string")
    .notEmpty()
    .withMessage("Description cannot be empty"),

  handleValidationErrors,
];

// Update profile validation to remove profile_image URL validation
export const validateProfileUpdate = [
  body("fullName").optional().notEmpty().withMessage("Full name is required"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("currentPassword")
    .notEmpty()
    .withMessage("Current Password must be provided")
    .isString()
    .withMessage("Current password must be a string"),
  handleValidationErrors,
];

export const validateRegister = [
  body("fullName")
    .notEmpty()
    .withMessage("Full name is required")
    .isString()
    .withMessage("Full name must be a string"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("schoolId")
    .notEmpty()
    .withMessage("School ID is required")
    .isMongoId()
    .withMessage("Invalid school ID format"),
  body("nin")
    .optional()
    .isString()
    .withMessage("NIN must be a string")
    .isLength({ min: 11, max: 11 })
    .withMessage("NIN must be exactly 11 characters long"),
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["seller", "buyer"])
    .withMessage("Invalid role. Role must be either 'seller' or 'buyer'"),

  handleValidationErrors,
];

// Update ticket validation to remove imageUrls validation
export const validateCreateTicket = [
  body("subject")
    .notEmpty()
    .withMessage("Subject is required")
    .isString()
    .withMessage("Subject must be a string")
    .isLength({ min: 5, max: 200 })
    .withMessage("Subject must be between 5 and 200 characters"),
  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .isString()
    .withMessage("Description must be a string")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),
  body("issueType")
    .notEmpty()
    .withMessage("Issue type is required")
    .isIn(["account", "payment", "orders", "technical", "others"])
    .withMessage(
      "Invalid issue type. Must be one of: account, payment, orders, technical, others"
    ),
  handleValidationErrors,
];

export const validateAddReplyToTicket = [
  param("id")
    .notEmpty()
    .withMessage("Ticket ID is required")
    .isMongoId()
    .withMessage("Invalid ticket ID format"),
  body("reply")
    .notEmpty()
    .withMessage("Reply is required")
    .isString()
    .withMessage("Reply must be a string")
    .isLength({ min: 1, max: 1000 })
    .withMessage("Reply must be between 1 and 1000 characters"),
  handleValidationErrors,
];

export const validateAssignTicket = [
  param("id")
    .notEmpty()
    .withMessage("Ticket ID is required")
    .isMongoId()
    .withMessage("Invalid ticket ID format"),
  body("assignedToId")
    .notEmpty()
    .withMessage("Assigned To ID is required")
    .isMongoId()
    .withMessage("Invalid Assigned To ID format"),
  body("message")
    .optional()
    .isString()
    .withMessage("Message must be a string")
    .isLength({ max: 500 })
    .withMessage("Message must not exceed 500 characters"),
  handleValidationErrors,
];

export const validateUpdateTicketStatus = [
  param("id")
    .notEmpty()
    .withMessage("Ticket ID is required")
    .isMongoId()
    .withMessage("Invalid ticket ID format"),
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["open", "in_progress", "resolved", "closed"])
    .withMessage(
      "Invalid status. Must be one of: open, in_progress, resolved, closed"
    ),
  handleValidationErrors,
];

export const validateAddAdminNotes = [
  param("id")
    .notEmpty()
    .withMessage("Ticket ID is required")
    .isMongoId()
    .withMessage("Invalid ticket ID format"),
  body("note")
    .notEmpty()
    .withMessage("Note is required")
    .isString()
    .withMessage("Note must be a string")
    .isLength({ min: 1, max: 1000 })
    .withMessage("Note must be between 1 and 1000 characters"),
  handleValidationErrors,
];

export const validateTicketId = [
  param("id")
    .notEmpty()
    .withMessage("Ticket ID is required")
    .isMongoId()
    .withMessage("Invalid ticket ID format"),
  handleValidationErrors,
];
