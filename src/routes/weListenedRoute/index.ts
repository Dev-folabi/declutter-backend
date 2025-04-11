import express from "express";
import {
  createWeListened,
  getAllWeListened,
  removeWeListened,
  getWeListenedById,
  updateWeListened,
  deleteWeListened,
} from "../../controllers/welistenedController";

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
 *     description: Submit a new feedback message to the platform
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: The feedback message content
 *     responses:
 *       201:
 *         description: Your message has been created successfully.
 *       400:
 *         description: Invalid data
 *
 * /api/allwelistened:
 *   get:
 *     tags: [WeListened]
 *     summary: Get all WeListened messages
 *     description: Retrieve a list of all submitted feedback messages
 *     responses:
 *       200:
 *         description: Feedback messages retrieved successfully.
 *       400:
 *         description: Error retrieving feedback messages
 *
 * /api/welistened/{id}:
 *   get:
 *     tags: [WeListened]
 *     summary: Get a single WeListened message by ID
 *     description: Retrieve a specific feedback message using its ID
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
 *     summary: Update a WeListened message by ID
 *     description: Update a specific feedback message
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
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: Updated message content
 *     responses:
 *       200:
 *         description: Your message has been updated successfully.
 *       404:
 *         description: WeListened message not found
 *
 * /api/deleteWelistened/{id}:
 *   delete:
 *     tags: [WeListened]
 *     summary: Delete a WeListened message by ID
 *     description: Permanently remove a specific feedback message
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
 *       404:
 *         description: WeListened message not found
 */

router.post("/welistened", createWeListened);
router.get("/allwelistened", getAllWeListened);
router.get("/welistened/:id", getWeListenedById);
router.delete("/deleteWelistened/:id", removeWeListened);
router.patch("/update-welistened/:id", updateWeListened);

export default router;
