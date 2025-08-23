import express from "express";
import { verifyToken } from "../../middlewares/authMiddleware";
import {
    createTicket,
    addReplyToTicket,
} from "../../controllers/ticketController";

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
 *             properties:
 *               subject:
 *                 type: string
 *                 example: "Unable to login"
 *               description:
 *                 type: string
 *                 example: "I tried resetting my password but still cannot login."
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
 *       401:
 *         description: Unauthorized (user not logged in)
 */

/**
 * @swagger
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

router.post("/create", createTicket);
router.post(
    "/:id/reply",
    addReplyToTicket
);
export default router;