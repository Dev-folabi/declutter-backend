import express from "express";
import { verifyToken } from "../../middlewares/authMiddleware";
import {
    createTicket,
    addReplyToTicket,
} from "../../controllers/ticketController";
import {
    validateCreateTicket,
    validateAddReplyToTicket,
} from "../../middlewares/validators";

const router = express.Router();

/**
 * @swagger
 * /api/tickets/create:
 *   post:
 *     summary: Create a new support ticket
 *     tags: [Support Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - description
 *               - issueType
 *             properties:
 *               subject:
 *                 type: string
 *                 example: "Unable to login"
 *               description:
 *                 type: string
 *                 example: "I tried resetting my password but still cannot login."
 *               issueType:
 *                 type: string
 *                 enum: [account, payment, orders, technical, others]
 *                 example: "account"
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
 *                 description: Optional array of image URLs
 *     responses:
 *       201:
 *         description: Support ticket created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/SupportTicket'
 *       400:
 *         description: Invalid issue type or missing required fields
 *       401:
 *         description: Unauthorized (user not logged in)
 *
 * /api/tickets/{id}/reply:
 *   post:
 *     summary: Add a reply to a support ticket
 *     tags: [Support Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Ticket ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reply
 *             properties:
 *               reply:
 *                 type: string
 *                 example: "We are looking into your issue and will update you soon."
 *     responses:
 *       200:
 *         description: Reply added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/SupportTicket'
 *       403:
 *         description: Forbidden (user/admin not authorized to reply)
 *       404:
 *         description: Support ticket not found
 */

router.post("/create", verifyToken, validateCreateTicket, createTicket);
router.post(
    "/:id/reply",
    verifyToken,
    validateAddReplyToTicket,
    addReplyToTicket
);

export default router;