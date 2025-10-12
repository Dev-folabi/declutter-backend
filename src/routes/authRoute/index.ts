import express from "express";
import {
  validateAddSchoolsBulk,
  validateLogin,
  validateRegister,
  validateResetPassword,
  validateResetPasswordOTP,
  validateResendVerificationOTP,
  validateVerifyEmailOTP,
} from "../../middlewares/validators";
import {
  addSchoolsBulk,
  getSchools,
  loginUser,
  registerUser,
  resetPasswordOTP,
  resetPassword,
  resendVerificationOtp,
  verifyEmail,
} from "../../controllers/authController";
import { authorizeRoles, verifyToken } from "../../middlewares/authMiddleware";
import { ADMIN_ONLY_ROLES } from "../../constant";
import { uploadFields } from "../../middlewares/upload";

const router = express.Router();

/**
 * @swagger
 * /api/auth/school:
 *   post:
 *     tags: [Authentication]
 *     summary: Add schools in bulk
 *     description: Add multiple schools to the system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               schools:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     schoolName:
 *                       type: string
 *                     location:
 *                       type: string
 *     responses:
 *       200:
 *         description: Schools added successfully
 *       400:
 *         description: Invalid input data or all schools already exist
 *
 * /api/auth/schools:
 *   get:
 *     tags: [Authentication]
 *     summary: Get all schools
 *     description: Retrieve list of all schools
 *     responses:
 *       200:
 *         description: List of schools retrieved successfully
 *
 * /api/auth/signup:
 *   post:
 *     tags: [Authentication]
 *     summary: Register new user
 *     description: Create a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *               - schoolId
 *               - role
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               schoolId:
 *                 type: string
 *               schoolIdCard:
 *                 type: string
 *                 format: binary
 *                 description: School ID card image file (required for sellers)
 *               nin:
 *                 type: string
 *                 format: binary
 *                 description: National Identification Number image file (required for sellers)
 *               accountNumber:
 *                 type: string
 *                 description: Bank account number (required for sellers)
 *               bankCode:
 *                 type: string
 *                 description: Bank code (required for sellers)
 *               pin:
 *                 type: string
 *                 description: Transaction PIN (required for sellers)
 *               role:
 *                 type: string
 *                 enum: [buyer, seller]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid registration data or missing required fields for seller role
 *
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: User login
 *     description: Authenticate user and generate access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *
 * /api/auth/reset-password-otp:
 *   post:
 *     tags: [Authentication]
 *     summary: Request password reset OTP
 *     description: Send OTP to user's email for password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       404:
 *         description: User not found
 *
 * /api/auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset password
 *     description: Reset user password using OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               OTP:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid OTP or password
 *
 * /api/auth/verify-otp:
 *   post:
 *     tags: [Authentication]
 *     summary: Verify Email
 *     description: Verify user email using OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               OTP:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successful
 *       400:
 *         description: User not found
 *
 * /api/auth/resend-otp:
 *   post:
 *     tags: [Authentication]
 *     summary: Resend verification OTP
 *     description: Resend OTP to user's email if their account is not yet verified
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: A new OTP has been sent to your email
 *       400:
 *         description: Email is already verified
 *       404:
 *         description: User not found
 */
router.post(
  "/school",
  validateAddSchoolsBulk,
  verifyToken,
  authorizeRoles(...ADMIN_ONLY_ROLES),
  addSchoolsBulk
);
router.get("/schools", getSchools);

router.post(
  "/signup",
  uploadFields([
    { name: "schoolIdCard", maxCount: 1 },
    { name: "nin", maxCount: 1 },
  ]),
  validateRegister,
  registerUser
);
router.post("/login", validateLogin, loginUser);
router.post("/reset-password-otp", validateResetPasswordOTP, resetPasswordOTP);
router.post("/reset-password", validateResetPassword, resetPassword);
router.post("/verify-otp", validateVerifyEmailOTP, verifyEmail);
router.post(
  "/resend-otp",
  validateResendVerificationOTP,
  resendVerificationOtp
);

export default router;
