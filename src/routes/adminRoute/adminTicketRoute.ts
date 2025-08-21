import express from "express";
import { verifyToken, authorizeRoles } from "../../middlewares/authMiddleware";
import { ADMIN_ONLY_ROLES } from "../../constant";
import {
  getAllTickets,
  getTicketById,
  addAdminNotes,
  deleteTicket,
  updateTicketStatus,
} from "../../controllers/admin/supportTicketController";

const router = express.Router();


/**
 * @swagger
 *  /api/admin/ticket/{id}/status:
 *    put:
 *     summary: Update the status of a support ticket
 *     tags: [Support Tickets]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, in-progress, resolved, closed]
 *     responses:
 *       200:
 *         description: Ticket status updated successfully
 *       404:
 *         description: Ticket not found
 * 
 * /api/admin/ticket/{id}/admin-notes:
 *   post:
 *     summary: Add an admin note to a support ticket
 *     tags: [Support Tickets]
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
 *               - note
 *             properties:
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin note added successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Ticket not found
 * 
 * /api/admin/ticket/{id}/delete:
 *   delete:
 *     summary: Delete a support ticket
 *     tags: [Support Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Ticket ID
 *     responses:
 *       200:
 *         description: Support ticket deleted successfully
 *       404:
 *         description: Support ticket not found
 * 
 * /api/admin/ticket/{id}:
 *   get:
 *     summary: Get a support ticket by ID
 *     tags: [Support Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Ticket ID
 *     responses:
 *       200:
 *         description: Support ticket retrieved successfully
 *       404:
 *         description: Support ticket not found
 * 
 * /api/admin/ticket/all-tickets:
 *   get:
 *     summary: Get all support tickets (admin only)
 *     tags: [SupportTickets]
 *     responses:
 *       200:
 *         description: Tickets retrieved successfully
 * 
 */

router.get("/all-tickets", authorizeRoles(...ADMIN_ONLY_ROLES), getAllTickets);
router.get("/:id", authorizeRoles(...ADMIN_ONLY_ROLES), getTicketById);

router.post(
    "/:id/admin-notes",
    authorizeRoles(...ADMIN_ONLY_ROLES),
    addAdminNotes
)
router.delete(
  "/:id/delete",
  authorizeRoles(...ADMIN_ONLY_ROLES),
  deleteTicket
);
router.patch(
  "/:id/status",
  authorizeRoles(...ADMIN_ONLY_ROLES),
  updateTicketStatus
);
export default router;