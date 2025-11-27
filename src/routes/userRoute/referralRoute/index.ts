import express from "express";
import {
  getReferredUsers,
  getReferrer,
} from "../../../controllers/referralController";

const router = express.Router();

/**
 * @swagger
 * /api/user/referrals/referred-users:
 *   get:
 *     tags: [Referrals]
 *     summary: Get users referred by logged-in user
 *     description: Retrieve a paginated list of all users who registered using your referral code, along with total referral rewards earned
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Successfully retrieved referred users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     referredUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           fullName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     totalCount:
 *                       type: integer
 *                       description: Total number of users you have referred
 *                     totalRewardsEarned:
 *                       type: number
 *                       description: Total referral rewards earned in NGN
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized - token missing or invalid
 *
 * /api/user/referrals/referrer:
 *   get:
 *     tags: [Referrals]
 *     summary: Get who referred the logged-in user
 *     description: Retrieve information about the user who referred you, or null if you weren't referred by anyone
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved referrer information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     fullName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     referralCode:
 *                       type: string
 *                 message:
 *                   type: string
 *                   description: Only present when user has no referrer
 *       401:
 *         description: Unauthorized - token missing or invalid
 *       404:
 *         description: User not found
 */

router.get("/referred-users", getReferredUsers);
router.get("/referrer", getReferrer);

export default router;
