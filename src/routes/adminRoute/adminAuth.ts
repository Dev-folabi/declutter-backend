import express from "express";
import {
  registerAdmin,
  loginAdmin,
  verifyAdminEmail,
  resetAdminPasswordOTP,
  resetAdminPassword,
  getAdminProfile,
  updateAdminProfile,
  updateAdminPassword,
  resendOTP,
} from "../../controllers/admin/authController";
import { verifyToken, authorizeRoles } from "../../middlewares/authMiddleware";
import { ADMIN_ONLY_ROLES } from "../../constant";

import {
  validateAdminRegister,
  validateLogin,
  validateVerifyEmailOTP,
  validateResetPassword,
  validateResetPasswordOTP,
  validateUpdateAdminProfile,
  validateChangePassword,
  validateResendVerificationOTP,
} from "../../middlewares/validators";
import { uploadSingle } from "../../middlewares/upload";

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
 *
 *   /api/admin/auth/resend-otp:
 *     post:
 *       summary: Resend OTP for account activation or password reset
 *       tags: [Admin Authentication]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - email
 *                 - type
 *               properties:
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: "admin@example.com"
 *                 type:
 *                   type: string
 *                   enum: [activate account, password]
 *                   example: "activate account"
 *       responses:
 *         '200':
 *           description: OTP sent successfully
 *         '400':
 *           description: Account already verified, invalid OTP type, or input error
 *         '404':
 *           description: Admin not found
 *
 *   /api/admin/auth/profile:
 *     get:
 *       summary: Get admin profile
 *       tags: [Admin Authentication]
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         '200':
 *           description: Admin profile fetched successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   message:
 *                     type: string
 *                     example: "Admin profile fetched successfully"
 *                   data:
 *                     $ref: '#/components/schemas/Admin'
 *         '401':
 *           description: Unauthorized
 *     patch:
 *       summary: Update admin profile
 *       tags: [Admin Authentication]
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           multipart/form-data:
 *             schema:
 *               type: object
 *               properties:
 *                 fullName:
 *                   type: string
 *                   example: "Jane Doe"
 *                 profileImageURL:
 *                   type: string
 *                   format: binary
 *       responses:
 *         '200':
 *           description: Profile updated successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   message:
 *                     type: string
 *                     example: "Profile updated successfully"
 *                   data:
 *                     $ref: '#/components/schemas/Admin'
 *         '401':
 *           description: Unauthorized
 *
 *   /api/admin/auth/update-password:
 *     patch:
 *       summary: Update admin password
 *       tags: [Admin Authentication]
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - old_password
 *                 - new_password
 *                 - confirm_password
 *               properties:
 *                 old_password:
 *                   type: string
 *                   format: password
 *                   example: "OldPass123!"
 *                 new_password:
 *                   type: string
 *                   format: password
 *                   example: "NewPass123!"
 *                 confirm_password:
 *                   type: string
 *                   format: password
 *                   example: "NewPass123!"
 *       responses:
 *         '200':
 *           description: Password updated successfully
 *         '400':
 *           description: Passwords do not match or incorrect old password
 *         '401':
 *           description: Unauthorized
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
router.post("/resend-otp", validateResendVerificationOTP, resendOTP);

router.get(
  "/profile",
  verifyToken,
  authorizeRoles(...ADMIN_ONLY_ROLES),
  getAdminProfile
);
router.patch(
  "/profile",
  verifyToken,
  authorizeRoles(...ADMIN_ONLY_ROLES),
  uploadSingle("profileImageURL"),
  validateUpdateAdminProfile,
  updateAdminProfile
);
router.patch(
  "/update-password",
  verifyToken,
  authorizeRoles(...ADMIN_ONLY_ROLES),
  validateChangePassword,
  updateAdminPassword
);

export default router;
