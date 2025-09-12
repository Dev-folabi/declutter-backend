import express from "express";

import {
  getUserNotifications,
  getUserSingleNotification,
} from "../../controllers/notificationController";

const router = express.Router();

/**
 * @swagger
 * /api/notification/allnotifications:
 *   get:
 *     tags: [Notification]
 *     summary: Get user notifications
 *     description: Get user notifications
 *     responses:
 *       200:
 *         description: User notifications retrieved successfully
 *       400:
 *         description: Not found
 *
 * /api/notification/notification/id:
 *   get:
 *     tags: [Notification]
 *     summary: Get single user notification
 *     description: Get single user notification
 *     responses:
 *       200:
 *         description: User notification retrieved successfully
 *       400:
 *         description: Not found
 */

router.get("/allnotifications", getUserNotifications);
router.get("/notification/:id", getUserSingleNotification);

export default router;
