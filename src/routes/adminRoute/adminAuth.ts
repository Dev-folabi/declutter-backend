import express from "express";
import {
  registerAdmin,
  loginAdmin,
  verifyAdminEmail,
  resetAdminPasswordOTP,
  resetAdminPassword,
} from "../../controllers/admin/authController";

import {
  validateAdminRegister,
  validateLogin,
  validateVerifyEmailOTP,
  validateResetPassword,
  validateResetPasswordOTP,
} from "../../middlewares/validators";

const router = express.Router();
/**
 * @swagger
 * tags:
 *   - name: Admin Authentication
 *     description: Endpoints for admin authentication
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Admin:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "64f8a2c9b2d3c1a23e4f5678"
 *         fullName:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "admin@example.com"
 *         role:
 *           type: string
 *           enum: [super_admin, admin, support_agent]
 *           example: "admin"
 *
 * paths:
 *   /api/admin/auth/signup:
 *     post:
 *       summary: Register a new admin
 *       tags: [Admin Authentication]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - fullName
 *                 - email
 *                 - password
 *                 - role
 *               properties:
 *                 fullName:
 *                   type: string
 *                   example: "Jane Smith"
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: "jane@example.com"
 *                 password:
 *                   type: string
 *                   format: password
 *                   example: "StrongPass123!"
 *                 role:
 *                   type: string
 *                   enum: [super_admin, admin, support_agent]
 *                   example: "admin"
 *       responses:
 *         '201':
 *           description: Admin registered successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Admin'
 *         '400':
 *           description: Invalid registration data or missing required fields
 *
 *   /api/admin/auth/login:
 *     post:
 *       summary: Login as an admin
 *       tags: [Admin Authentication]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - email
 *                 - password
 *               properties:
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: "admin@example.com"
 *                 password:
 *                   type: string
 *                   format: password
 *                   example: "StrongPass123!"
 *       responses:
 *         '200':
 *           description: Login successful
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   token:
 *                     type: string
 *                     description: JWT access token
 *         '400':
 *           description: Email not verified or input error
 *         '401':
 *           description: Invalid credentials
 *
 *   /api/admin/auth/verify-otp:
 *     post:
 *       summary: Verify email using OTP
 *       tags: [Admin Authentication]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - otp
 *               properties:
 *                 otp:
 *                   type: string
 *                   example: "123456"
 *       responses:
 *         '200':
 *           description: Email verified successfully
 *         '400':
 *           description: Invalid OTP
 *
 *   /api/admin/auth/reset-password-otp:
 *     post:
 *       summary: Request OTP to reset password
 *       tags: [Admin Authentication]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - email
 *               properties:
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: "admin@example.com"
 *       responses:
 *         '200':
 *           description: OTP sent to email
 *         '404':
 *           description: Admin not found
 *
 *   /api/admin/auth/reset-password:
 *     post:
 *       summary: Reset password using OTP
 *       tags: [Admin Authentication]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - otp
 *                 - newPassword
 *               properties:
 *                 otp:
 *                   type: string
 *                   example: "123456"
 *                 newPassword:
 *                   type: string
 *                   format: password
 *                   example: "NewPass123!"
 *       responses:
 *         '200':
 *           description: Password reset successful
 *         '400':
 *           description: Missing fields or invalid OTP
 *         '404':
 *           description: Admin not found
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

export default router;
