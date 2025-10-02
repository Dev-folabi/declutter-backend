import express from "express";
import {
  registerAdmin,
  loginAdmin,
  verifyAdminEmail,
  resetAdminPasswordOTP,
  resetAdminPassword,
  getAdminUsers,
} from "../../controllers/admin/authController";

import {
  validateAdminRegister,
  validateLogin,
  validateVerifyEmailOTP,
  validateResetPassword,
  validateResetPasswordOTP,
} from "../../middlewares/validators";

import { verifyToken, authorizeRoles } from "../../middlewares/authMiddleware"; // Import middleware

const router = express.Router();
/**
 * @swagger
 * /api/admin/auth/signup:
 *   post:
 *     summary: Register a new admin
 *     tags: [Admin Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password, role]
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [super_admin, admin, support_agent]
 *     responses:
 *       '201':
 *         description: Admin registered successfully
 *       '400':
 *         description: Invalid registration data or missing required fields for the role
 *
 * /api/admin/auth/login:
 *   post:
 *     summary: Login as an admin
 *     tags: [Admin Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Login successful
 *       '400':
 *         description: Email not verified or input error
 *       '401':
 *         description: Invalid credentials
 *
 * /api/admin/auth/verify-otp:
 *   post:
 *     summary: Verify email using OTP
 *     tags: [Admin Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [OTP]
 *             properties:
 *               OTP:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Email verified successfully
 *       '400':
 *         description: Invalid OTP
 *
 * /api/admin/auth/reset-password-otp:
 *   post:
 *     summary: Request OTP to reset password
 *     tags: [Admin Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       '200':
 *         description: OTP sent to email
 *       '404':
 *         description: Admin not found
 *
 * /api/admin/auth/reset-password:
 *   post:
 *     summary: Reset password using OTP
 *     tags: [Admin Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [OTP, newPassword]
 *             properties:
 *               OTP:\
 *                 type: string\
 *               newPassword:\
 *                 type: string\
 *     responses:
 *       '200':\
 *         description: Password reset successful\
 *       '400':\
 *         description: Missing fields or invalid OTP\
 *       '404':\
 *         description: Admin not found
 * /api/admin/auth/users:
 *   get:
 *     summary: Get all admin users (Super Admin only)
 *     tags: [Admin Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Admin users fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Admin' # Assuming you have an Admin schema defined
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Access denied
 */

// Admin-only routes
router.post("/signup", validateAdminRegister, registerAdmin);
router.post("/login", validateLogin, loginAdmin);
router.post(
  "/reset-password-otp",
  validateResetPasswordOTP,
  resetAdminPasswordOTP
);
router.post("/reset-password", validateResetPassword, resetAdminPassword);
router.post("/verify-otp", validateVerifyEmailOTP, verifyAdminEmail);

// Super Admin route to get all admin users
router.get("/users", verifyToken, authorizeRoles("super_admin"), getAdminUsers);

export default router;
