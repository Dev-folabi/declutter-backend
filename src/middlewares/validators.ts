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

export const validateBecomeSeller = [
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
  body("pin")
    .notEmpty()
    .withMessage("Pin must be provided")
    .isString()
    .withMessage("Pin must be a string"),
  handleValidationErrors,
];

export const validateResendVerificationOTP = [
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
    .withMessage("Password must be string")
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Password must be 8 characters containing at least a special character, a number, an uppercase and lowercase letter"
    ),
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
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Password must be 8 characters containing at least a special character, a number, an uppercase and lowercase letter"
    )
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
  body("fullName")
    .notEmpty()
    .withMessage("Full name is required")
    .matches(/^(?=.*[a-zA-Z])[a-zA-Z\s'-]+$/)
    .withMessage(
      "Full name may only contain letters, spaces, hyphens, or apostrophes"
    ),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address"),
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["super_admin", "admin", "support_agent", "account_officer"])
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
    .isIn(["approved", "rejected"])
    .withMessage('Status must be either "approved" or "rejected".'),

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

  body("action")
    .notEmpty()
    .withMessage("Action is required")
    .isIn(["activate", "suspend"])
    .withMessage('Action must be either "activate" or "suspend"'),

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
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters")
    .isString()
    .withMessage("Description must be a string"),
  body("categoryId").notEmpty().withMessage("categoryId is required"),
  body("phoneNumber")
    .notEmpty()
    .withMessage("Phone number is required")
    .isString()
    .withMessage("Phone number must be a string")
    .matches(/^\+?[1-9]\d{9,14}$/)
    .withMessage(
      "Invalid phone number format (must be in international format, e.g. +2348012345678)"
    ),
  body("productType")
    .notEmpty()
    .withMessage("Product type is required")
    .isIn(["new", "used"])
    .withMessage("Invalid product type. Must be 'new' or 'used'"),
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

  body("categoryId").notEmpty().withMessage("categoryId is required"),

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

  check("productType")
    .if((value, { req }) => req.body.productType)
    .notEmpty()
    .withMessage("Product type cannot be empty")
    .isIn(["new", "used"])
    .withMessage("Invalid product type. Must be 'new' or 'used'"),

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
    .matches(/^(?=.*[a-zA-Z])[a-zA-Z\s'-]+$/)
    .withMessage(
      "Full name may only contain letters, spaces, hyphens, or apostrophes"
    )
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

export const validateCreateAnnouncement = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string")
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters")
    .trim(),

  body("message")
    .notEmpty()
    .withMessage("Message is required")
    .isString()
    .withMessage("Message must be a string")
    .isLength({ min: 10, max: 5000 })
    .withMessage("Message must be between 10 and 5000 characters")
    .trim(),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isString()
    .withMessage("Category must be a string")
    .isIn(["Buyers", "Sellers", "All"])
    .withMessage("Invalid category. Must be 'Buyers', 'Sellers', or 'All'"),

  handleValidationErrors,
];

export const validateOrderCheckout = [
  body("deliveryType")
    .notEmpty()
    .withMessage("Delivery type is required")
    .isIn(["pickup", "delivery"])
    .withMessage("Invalid delivery type"),

  body("deliveryAddress.location")
    .if(body("deliveryType").equals("delivery"))
    .notEmpty()
    .withMessage("Delivery location is required"),

  body("deliveryAddress.landmark")
    .if(body("deliveryType").equals("delivery"))
    .notEmpty()
    .withMessage("Landmark is required"),

  body("deliveryAddress.primaryPhoneNumber")
    .if(body("deliveryType").equals("delivery"))
    .notEmpty()
    .withMessage("Primary phone number is required"),

  handleValidationErrors,
];

export const validateCreateCategory = [
  body("name")
    .notEmpty()
    .withMessage("Category name is required")
    .isString()
    .withMessage("Category name must be a string")
    .isLength({ min: 3, max: 100 })
    .withMessage("Category name must be between 3 and 100 characters")
    .trim(),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters")
    .trim(),
  handleValidationErrors,
];

export const validateContactUs = [
  body("fullName")
    .notEmpty()
    .withMessage("Full name is required")
    .matches(/^(?=.*[a-zA-Z])[a-zA-Z\s'-]{2,50}$/)
    .withMessage(
      "Full name must be 2–50 characters and may only contain letters, spaces, hyphens, or apostrophes"
    )
    .isString()
    .withMessage("Full name must be a string"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("issue")
    .notEmpty()
    .withMessage("Issue type is required")
    .isIn(["account", "payment", "order", "others"])
    .withMessage(
      "Invalid issue type. Must be one of: account, payment, order, others"
    ),
  body("body")
    .notEmpty()
    .withMessage("Message body is required")
    .isString()
    .withMessage("Message body must be a string")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Message body must be between 10 and 2000 characters"),
  handleValidationErrors,
];
export const validateOrderAvailability = [
  param("orderId")
    .notEmpty()
    .withMessage("Order ID is required")
    .isMongoId()
    .withMessage("Invalid order ID format"),
  body("isAvailable")
    .notEmpty()
    .withMessage("isAvailable field is required")
    .isBoolean()
    .withMessage("isAvailable must be a boolean value"),
  handleValidationErrors,
];
export const validateLogisticStatusUpdate = [
  param("logisticId")
    .notEmpty()
    .withMessage("Logistic ID is required")
    .isMongoId()
    .withMessage("Invalid logistic ID format"),
  body("action")
    .notEmpty()
    .withMessage("Action field is required")
    .isIn(["picked_up", "delivered", "to_be_picked_up"])
    .withMessage(
      "Action must be one of: picked_up, delivered, to_be_picked_up"
    ),
  handleValidationErrors,
];

export const validateCreateInvoice = [
  body("itemId")
    .notEmpty()
    .withMessage("Item ID is required")
    .isString()
    .withMessage("Invalid Item ID format"),
  body("typeOfAssignment")
    .notEmpty()
    .withMessage("Type of assignment is required")
    .isIn(["pickup", "delivery", "pickup_and_delivery"])
    .withMessage(
      "Type of assignment must be one of: pickup, delivery, pickup_and_delivery"
    ),
  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ min: 0 })
    .withMessage("Amount must be a number greater than  0"),
  body("deliveryAddress")
    .optional()
    .isString()
    .withMessage("Delivery address must be a string"),
  body("pickupAddress")
    .optional()
    .isString()
    .withMessage("Pickup address must be a string"),
  handleValidationErrors,
];

export const validateSetInvoiceStatus = [
  param("id")
    .notEmpty()
    .withMessage("Invoice ID is required")
    .isMongoId()
    .withMessage("Invalid invoice ID format"),
  body("status")
    .notEmpty()
    .withMessage("Status field is required")
    .isIn(["successfull", "failed"])
    .withMessage("Status must be one of: successfull, failed"),
  handleValidationErrors,
];

export const validateUpdateAdminProfile = [
  body("fullName")
    .optional()
    .isString()
    .withMessage("Full name must be a string")
    .matches(/^(?=.*[a-zA-Z])[a-zA-Z\s'-]+$/)
    .withMessage(
      "Full name may only contain letters, spaces, hyphens, or apostrophes"
    ),
  body("profileImageURL")
    .optional()
    .isString()
    .withMessage("Profile image URL must be a string")
    .isURL()
    .withMessage("Invalid URL format"),
  handleValidationErrors,
];
