import express from "express";
import {
  createAnnouncement,
  getAnnouncementHistory,
} from "../../controllers/admin/announcementController";
import { validateCreateAnnouncement } from "../../middlewares/validators";
import { authorizeRoles } from "../../middlewares/authMiddleware";
import { ADMIN_ONLY_ROLES } from "../../constant";

const router = express.Router();

/**
 * @swagger
 * /api/admin/announcement/create:
 *   post:
 *     summary: Create and broadcast a new announcement
 *     description: >
 *       Allows an admin to create an announcement and broadcast it to users.
 *       The announcement can target all users, only buyers, or only sellers.
 *       Requires a valid admin token.
 *     tags:
 *       - Announcements
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 example: "System Maintenance"
 *               message:
 *                 type: string
 *                 example: "We will be offline for 2 hours tonight."
 *               category:
 *                 type: string
 *                 enum: [Buyers, Sellers, All]
 *                 example: "All"
 *     responses:
 *       201:
 *         description: Announcement created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Announcement created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64e41a9f1b9a3e4a12345678"
 *                     title:
 *                       type: string
 *                       example: "System Maintenance"
 *                     message:
 *                       type: string
 *                       example: "We will be offline for 2 hours tonight."
 *                     category:
 *                       type: string
 *                       example: "All"
 *                     createdBy:
 *                       type: string
 *                       example: "64e41a9f1b9a3e4a87654321"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-08-21T16:45:00.000Z"
 *       400:
 *         description: Invalid category provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid category. Must be 'Buyers', 'Sellers', or 'All'."
 *       401:
 *         description: Unauthorized (admin not found or token invalid)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "You are not authorized to perform this action"
 *       500:
 *         description: Internal server error
 *
 * /api/admin/announcement/history:
 *   get:
 *     summary: Get all announcements
 *     description: >
 *       Allows an admin to retrieve a complete history of all announcements.
 *       Requires a valid admin token.
 *     tags:
 *       - Announcements
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Announcements fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Announcement history fetched successfully.
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized (admin not found or token invalid)
 *       500:
 *         description: Internal server error
 */

router.post(
  "/create",
  authorizeRoles(...ADMIN_ONLY_ROLES),
  validateCreateAnnouncement,
  createAnnouncement
);

router.get("/history", authorizeRoles(...ADMIN_ONLY_ROLES), getAnnouncementHistory);

export default router;
