import express from "express";
import {
  validateChangePassword,
  validateProfileUpdate,
  validateRequestOtp,
  validateBankUpdate,
  validateChangePin,
} from "../../middlewares/validators";

import {
  changePassword,
  requestOTP,
  updateBankDetail,
  updateProfile,
  userProfile,
  updatePin,
} from "../../controllers/userController";
import { authorizeRoles, verifyToken } from "../../middlewares/authMiddleware";
import { uploadSingle } from "../../middlewares/upload";
import becomeSellerRoute from "./becomeSellerRoute";

const router = express.Router();

router.use("/", becomeSellerRoute);

/**
 * @swagger
 * /api/user/update-profile:
 *   patch:
 *     tags: [Profile]
 *     summary: Update user profile
 *     description: Update user information
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file
 *               currentPassword:
 *                 type: string
 *                 description: Current password for verification
 *     responses:
 *       200:
 *         description: User information successfully
 *       400:
 *         description: Invalid input data
 *
 * /api/user/changepassword:
 *   patch:
 *     tags: [Profile]
 *     summary: Change user password
 *     description: Change user psasword
 *     parameters:
 *       - in: body
 *         name: user
 *         description: User password
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             old_password:
 *               type: string
 *             new_password:
 *               type: string
 *             confirm_password:
 *               type: string
 *     responses:
 *       200:
 *         description: User password changed successfully
 *       400:
 *         description: Invalid input data
 *
 * /api/user/updatepin:
 *   patch:
 *     tags: [Profile]
 *     summary: Change user pin
 *     description: Change user psasword
 *     parameters:
 *       - in: body
 *         name: user
 *         description: User pin
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             withdrawalPin:
 *               type: string
 *             new_pin:
 *               type: string
 *             confirm_pin:
 *               type: string
 *             currentPassword:
 *               type: string
 *     responses:
 *       200:
 *         description: User pin changed successfully
 *       400:
 *         description: Invalid input data
 *
 * /api/user/updateBank:
 *   patch:
 *     tags: [Profile]
 *     summary: Update Bank Details
 *     description: Update User bank details
 *     parameters:
 *       - in: body
 *         name: bank
 *         description: User bank details
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             accountNumber:
 *               type: string
 *             bankCode:
 *               type: string
 *             bankName:
 *               type: string
 *             currentPassword:
 *               type: string
 *             withdrawalPin:
 *               type: string
 *     responses:
 *       200:
 *         description: User password changed successfully
 *       400:
 *         description: Invalid input data
 *
 * /api/user/requestotp:
 *   post:
 *     tags: [Profile]
 *     summary: Request user otp
 *     description: Request Otp for validation of update tasks
 *     parameters:
 *       - in: body
 *         name: user
 *         description: Request Otp
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [password, transaction pin, activate account, edit profile]
 *             reason:
 *               type: string
 *     responses:
 *       200:
 *         description: User password changed successfully
 *       400:
 *         description: Invalid input data
 *
 * /api/user/profile:
 *   get:
 *     tags: [Profile]
 *     summary: Get User Profile
 *     description: Retrieve User Informations
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 */

router.get("/profile", verifyToken, userProfile);
router.patch(
  "/update-profile",
  verifyToken,
  uploadSingle("profileImage"),
  validateProfileUpdate,
  updateProfile
);
router.patch(
  "/changepassword",
  validateChangePassword,
  verifyToken,
  changePassword
);
router.post("/requestotp", validateRequestOtp, requestOTP);
router.patch(
  "/updateBank",
  validateBankUpdate,
  verifyToken,
  updateBankDetail
);
router.patch(
  "/updatePin",
  validateChangePin,
  verifyToken,
  updatePin
);

export default router;
