import express from "express";
import {
  validateAddSchoolsBulk,
  validateLogin,
  validateRegister,
  validateResetPassword,
  validateResetPasswordOTP,
} from "../../middlewares/validators";
import {
  addSchoolsBulk,
  getSchools,
  loginUser,
  registerUser,
  resetPasswordOTP,
  resetPassword,
} from "../../controllers/authController";

const router = express.Router();

/**
 * @swagger
 * /api/auth/school:
 *   post:
 *     tags: [Authentication]
 *     summary: Add schools in bulk
 *     description: Add multiple schools to the system
 *     responses:
 *       200:
 *         description: Schools added successfully
 *       400:
 *         description: Invalid input data
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
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid registration data
 *
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: User login
 *     description: Authenticate user and generate access token
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
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid OTP or password
 */

router.post("/school", validateAddSchoolsBulk, addSchoolsBulk);
router.get("/schools", getSchools);

router.post("/signup", validateRegister, registerUser);
router.post("/login", validateLogin, loginUser);
router.post("/reset-password-otp", validateResetPasswordOTP, resetPasswordOTP);
router.post("/reset-password", validateResetPassword, resetPassword);

export default router;
