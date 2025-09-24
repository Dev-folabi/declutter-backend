import express from "express";

import {
  sendContactUsMessage,
  getContactMessages,
  updateContactus,
  getSingleContactMessages,
} from "../../controllers/contactUsController";
import {validateContactUs} from "../../middlewares/validators";
import { authorizeRoles, verifyToken } from "../../middlewares/authMiddleware";
import { ADMIN_ONLY_ROLES } from "../../constant";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ContactUs
 *   description: Contact Us Message Management
 *
 * /api/contact-us:
 *   post:
 *     tags: [ContactUs]
 *     summary: Submit a contact us message
 *     description: Allows users to submit a contact message regarding account, payment, order, or other issues.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               body:
 *                 type: string
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               issue:
 *                 type: string
 *                 enum: [account, payment, order, others]
 *     responses:
 *       201:
 *         description: Contact message submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Message submitted successfully." }
 *                 data:
 *                   type: object
 *                   properties:
 *                     body: { type: string }
 *                     fullName: { type: string }
 *                     email: { type: string }
 *                     issue: { type: string, enum: [account, payment, order, others] }
 *       400:
 *         description: Invalid input
 *
 * /api/admin/update-contact-us/{id}:
 *   patch:
 *     tags: [ContactUs]
 *     summary: Mark a contact message as closed
 *     description: Admin can update a contact message status to closed using the message ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The ID of the contact message
 *     responses:
 *       200:
 *         description: Message successfully marked as closed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Message marked as closed." }
 *                 data:
 *                   type: object
 *                   properties:
 *                     body: { type: string }
 *                     fullName: { type: string }
 *                     email: { type: string }
 *                     issue: { type: string, enum: [account, payment, order, others] }
 *       404:
 *         description: Message not found
 *
 * /api/admin/single-contact-us/{id}:
 *   get:
 *     tags: [ContactUs]
 *     summary: Get a contact us message by ID
 *     description: Admin can retrieve a specific contact message by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The ID of the contact message
 *     responses:
 *       200:
 *         description: Message retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Message retrieved successfully." }
 *                 data:
 *                   type: object
 *                   properties:
 *                     body: { type: string }
 *                     fullName: { type: string }
 *                     email: { type: string }
 *                     issue: { type: string, enum: [account, payment, order, others] }
 *       404:
 *         description: Message not found
 *
 * /api/admin/all-contact-us:
 *   get:
 *     tags: [ContactUs]
 *     summary: Get all contact us messages
 *     description: Admin can retrieve all submitted contact messages.
 *     responses:
 *       200:
 *         description: All contact messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "All messages retrieved successfully." }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       body: { type: string }
 *                       fullName: { type: string }
 *                       email: { type: string }
 *                       issue: { type: string, enum: [account, payment, order, others] }
 *       404:
 *         description: No contact messages found
 */

router.post("/contact-us", validateContactUs, sendContactUsMessage);
router.get(
  "/admin/all-contact-us",
  verifyToken,
  authorizeRoles(...ADMIN_ONLY_ROLES),
  getContactMessages
);
router.get(
  "/admin/single-contact-us/:id",
  verifyToken,
  authorizeRoles(...ADMIN_ONLY_ROLES),
  getSingleContactMessages
);
router.patch(
  "/admin/update-contact-us/:id",
  verifyToken,
  authorizeRoles(...ADMIN_ONLY_ROLES),
  updateContactus
);

export default router;
