import express from "express";
import {
  createWeListened,
  getAllWeListened,
  getWeListenedById,
  updateWeListened,
  deleteWeListened,
} from "../../controllers/welistenedController";
import {
  verifyToken,
  authorizeRoles,
} from "../../middlewares/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: WeListened
 *     description: Manage user-submitted feedback messages
 *
 * /api/welistened:
 *   post:
 *     tags: [WeListened]
 *     summary: Create a new WeListened message
 *     description: Submit a new feedback message to the platform. No authentication required.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - message
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Your message has been created successfully.
 *       400:
 *         description: Invalid data
 *
 * /api/allwelistened:
 *   get:
 *     tags: [WeListened]
 *     summary: Get all WeListened messages (Admin/Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve a list of all submitted feedback messages.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: The page number to retrieve.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: The number of items to retrieve per page.
 *     responses:
 *       200:
 *         description: Feedback messages retrieved successfully.
 *       403:
 *         description: Access denied.
 *
 * /api/welistened/{id}:
 *   get:
 *     tags: [WeListened]
 *     summary: Get a single WeListened message by ID (Admin/Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     description: Retrieve a specific feedback message using its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the WeListened message
 *     responses:
 *       200:
 *         description: Feedback message retrieved successfully.
 *       404:
 *         description: WeListened message not found
 *
 * /api/update-welistened/{id}:
 *   patch:
 *     tags: [WeListened]
 *     summary: Update a WeListened message by ID (Admin/Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     description: Update a specific feedback message. Only the hasRead field can be updated.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the WeListened message to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hasRead:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Your message has been updated successfully.
 *       404:
 *         description: WeListened message not found
 *
 * /api/deleteWelistened/{id}:
 *   delete:
 *     tags: [WeListened]
 *     summary: Delete a WeListened message by ID (Super Admin only)
 *     security:
 *       - bearerAuth: []
 *     description: Permanently remove a specific feedback message.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the WeListened message to delete
 *     responses:
 *       200:
 *         description: Feedback message deleted successfully.
 *       403:
 *         description: Access denied.
 *       404:
 *         description: WeListened message not found
 */

router.post("/welistened", createWeListened);
router.get(
  "/allwelistened",
  verifyToken,
  authorizeRoles("admin", "super_admin"),
  getAllWeListened
);
router.get(
  "/welistened/:id",
  verifyToken,
  authorizeRoles("admin", "super_admin"),
  getWeListenedById
);
router.patch(
  "/update-welistened/:id",
  verifyToken,
  authorizeRoles("admin", "super_admin"),
  updateWeListened
);
router.delete(
  "/deleteWelistened/:id",
  verifyToken,
  authorizeRoles("super_admin"),
  deleteWeListened
);

export default router;
