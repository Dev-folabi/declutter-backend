import express from "express";
import {
  collectWaitlistEmail,
  sendWaitlistMessage,
} from "../../controllers/waitlistController";
import { validateWaitlist } from "../../middlewares/validators";

const router = express.Router();

/**
 * @swagger
 * /api/waitlist:
 *   post:
 *     tags: [Waitlist]
 *     summary: Add email to waitlist
 *     description: Collect user email for waitlist registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: User email to be added to the waitlist
 *                 example: user@example.com
 *     responses:
 *       201:
 *         description: Email added to waitlist successfully
 *       400:
 *         description: Invalid email format or email already on waitlist
 *
 * /api/waitlist/message:
 *   post:
 *     tags: [Waitlist]
 *     summary: Send message to waitlist
 *     description: Send message to all users on the waitlist
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       500:
 *         description: Error sending message
 */


router.post("/", validateWaitlist, collectWaitlistEmail);
router.post("/message", sendWaitlistMessage);

export default router;
