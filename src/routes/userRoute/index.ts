import express from "express";
import {
  validateChangePassword,
  validateProfileUpdate,
  validateRequestOtp,
  validateBankUpdate,
  validateChangePin
} from "../../middlewares/validators";

import { 
  changePassword,
  requestOTP,
  updateBankDetail,
  updateProfile, 
  userProfile,
  updatePin
} from "../../controllers/userController";

const router = express.Router();

/**
 * @swagger
 * /api/user/update-profile:
 *   patch:
 *     tags: [Profile]
 *     summary: Update user profile
 *     description: Update user information
 *     parameters:
 *       - in: body
 *         name: user
 *         description: User profile data
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             fullName:
 *               type: string
 *             email:
 *               type: string
 *             profile_image:
 *               type: string
 *             currentPassword:
 *               type: string
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
 * /api/user/changepin:
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
 *             accountName:
 *               type: string
 *             accountNumber:
 *               type: string
 *             bankCode:
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




router.get("/profile", userProfile);
router.patch("/update-profile", validateProfileUpdate, updateProfile);
router.patch("/changepassword", validateChangePassword, changePassword);
router.post("/requestotp", validateRequestOtp, requestOTP);
router.patch("/updateBank", validateBankUpdate, updateBankDetail);
router.patch("/updatePin", validateChangePin, updatePin);

export default router;
