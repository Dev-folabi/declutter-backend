import express from "express";
import {
  validateAddSchoolsBulk,
  validateLogin,
  validateRegister,
  validateResetPassword,
  validateResetPasswordOTP,
  validateVerifyEmailOTP,
} from "../../middlewares/validators";
import {
  addSchoolsBulk,
  getSchools,
  loginUser,
  registerUser,
  resetPasswordOTP,
  resetPassword,
  verifyEmail
} from "../../controllers/authController";

const router = express.Router();

/**
 * @swagger
 * /api/auth/school:
 *   post:
 *     tags: [Authentication]
 *     summary: Add schools in bulk
 *     description: Add multiple schools to the system
 *     parameters:
 *       - in: body
 *         name: schools
 *         description: Array of school objects to add to the system
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             schools:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   schoolName:
 *                     type: string
 *                   location:
 *                     type: string
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
 *     parameters:
 *       - in: body
 *         name: user
 *         description: User registration data
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             fullName:
 *               type: string
 *             email:
 *               type: string
 *             password:
 *               type: string
 *             schoolId:
 *               type: string
 *             schoolIdCardURL:
 *               type: string
 *             nin:
 *               type: string
 *             accountNumber:
 *               type: string
 *             bankCode:
 *               type: string
 *             pin:
 *               type: string
 *             role:
 *               type: string
 *               enum: [student, seller]
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
 *     parameters:
 *       - in: body
 *         name: login
 *         description: User login credentials
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             password:
 *               type: string
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
 *     parameters:
 *       - in: body
 *         name: otpRequest
 *         description: Email to send OTP for password reset
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
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
 *     parameters:
 *       - in: body
 *         name: resetPassword
 *         description: OTP and new password to reset the user’s password
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             OTP:
 *               type: string
 *             newPassword:
 *               type: string
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
 *     parameters:
 *       - in: body
 *         name: verifyOtp
 *         description: OTP and email to verify user’s email
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             OTP:
 *               type: string
 *             email:
 *               type: string
 *     responses:
 *       200:
 *         description: Email verified successful
 *       400:
 *         description: User not found
 */

router.post("/school", validateAddSchoolsBulk, addSchoolsBulk);
router.get("/schools", getSchools);

router.post("/signup", validateRegister, registerUser);
router.post("/login", validateLogin, loginUser);
router.post("/reset-password-otp", validateResetPasswordOTP, resetPasswordOTP);
router.post("/reset-password", validateResetPassword, resetPassword);
router.post("/verify-otp", validateVerifyEmailOTP, verifyEmail);

export default router;
