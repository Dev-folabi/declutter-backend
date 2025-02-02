import express from "express";
import {
  validateChangePassword,
  validateProfileUpdate,
} from "../../middlewares/validators";

import { 
  changePassword,
  updateProfile, 
  userProfile,
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
 *             accountNumber:
 *               type: string
 *             bankCode:
 *               type: string
 *             pin:
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

export default router;
