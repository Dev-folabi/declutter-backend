import express from "express";

import {
  sendContactUsMessage,
  getContactMessages,
  updateContactus,
  getSingleContactMessages,
} from "../../controllers/contactUsController";
import { authorizeRoles, verifyToken } from "../../middlewares/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * /api/contact-us:
 *   post:
 *     tags: [ContactUs]
 *     summary: Create a contact us message
 *     description: Create a contact us message
 *     parameters:
 *       - in: body
 *         name: ContactUs Message
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             body:
 *               type: string
 *             fullName:
 *               type: string
 *             email:
 *               type: string
 *             issue:
 *               type: string
 *               enum: [account, payment, order, others]
 *
 *     responses:
 *       200:
 *         description: Message successfully marked as closed
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
 *                   example: Message marked as closed.
 *                 data:
 *                   type: object
 *                   properties:
 *                     body:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     issue:
 *                       type: string
 *                       enum: [account, payment, order, others]
 *       404:
 *         description: Message not found
 *
 * /api/admin/update-contact-us/{id}:
 *   patch:
 *     summary: Mark a contact message as closed
 *     description: Updates the status of a contact message to closed
 *     tags:
 *       - ContactUs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the contact message to close
 *     responses:
 *       200:
 *         description: Message successfully marked as closed
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
 *                   example: Message marked as closed.
 *                 data:
 *                   type: object
 *                   properties:
 *                     body:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     issue:
 *                       type: string
 *                       enum: [account, payment, order, others]
 *       404:
 *         description: Message not found
 *
 * /api/admin/single-contact-us/{id}:
 *   get:
 *     summary: Get a contact us message
 *     description: Get a contact us message by ID
 *     tags:
 *       - ContactUs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the contact message to get
 *     responses:
 *       200:
 *         description: Message retrieved sucessfully
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
 *                   example: Message marked as closed.
 *                 data:
 *                   type: object
 *                   properties:
 *                     body:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     issue:
 *                       type: string
 *                       enum: [account, payment, order, others]
 *       404:
 *         description: Message not found
 *
 * /api/admin/all-contact-us:
 *   get:
 *     summary: Get a contact us message
 *     description: Get a contact us message by ID
 *     tags:
 *       - ContactUs
 *     responses:
 *       200:
 *         description: Message successfully marked as closed
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
 *                   example: Message marked as closed.
 *                 data:
 *                   type: object
 *                   properties:
 *                     body:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     issue:
 *                       type: string
 *                       enum: [account, payment, order, others]
 *       404:
 *         description: Message not found
 */

router.post("/contact-us", sendContactUsMessage);
router.get(
  "/admin/all-contact-us",
  verifyToken,
  authorizeRoles("admin"),
  getContactMessages
);
router.get(
  "/admin/single-contact-us/:id",
  verifyToken,
  authorizeRoles("admin"),
  getSingleContactMessages
);
router.patch(
  "/admin/update-contact-us/:id",
  verifyToken,
  authorizeRoles("admin"),
  updateContactus
);

export default router;
