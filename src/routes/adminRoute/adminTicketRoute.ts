import express from "express";
import { verifyToken, authorizeRoles } from "../../middlewares/authMiddleware";
import { ADMIN_ONLY_ROLES } from "../../constant";
import {
  getAllTickets,
  getTicketById,
  addAdminNotes,
  deleteTicket,
  updateTicketStatus,
  assignTicket,
} from "../../controllers/admin/supportTicketController";
import {
  validateTicketId,
  validateAssignTicket,
  validateUpdateTicketStatus,
  validateAddAdminNotes,
} from "../../middlewares/validators";

const router = express.Router();

/**
 * @swagger
 * /api/admin/ticket/all-tickets:
 *   get:
 *     summary: Get all support tickets with filtering and pagination
 *     tags: [Support Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of tickets per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in_progress, resolved, closed]
 *         description: Filter by ticket status
 *       - in: query
 *         name: issueType
 *         schema:
 *           type: string
 *           enum: [account, payment, orders, technical, others]
 *         description: Filter by issue type
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *         description: Filter by assigned admin ID
 *     responses:
 *       200:
 *         description: Tickets retrieved successfully
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
 *                   type: object
 *                   properties:
 *                     tickets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           subject:
 *                             type: string
 *                           issueType:
 *                             type: string
 *                           status:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                           user:
 *                             type: object
 *                             properties:
 *                               fullName:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                           assignedTo:
 *                             type: object
 *                             nullable: true
 *                     pagination:
 *                       type: object
 *
 * /api/admin/ticket/{id}:
 *   get:
 *     summary: Get a support ticket by ID with full details
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
 *     responses:
 *       200:
 *         description: Support ticket retrieved successfully
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
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     subject:
 *                       type: string
 *                     description:
 *                       type: string
 *                     issueType:
 *                       type: string
 *                     imageUrls:
 *                       type: array
 *                       items:
 *                         type: string
 *                     replies:
 *                       type: array
 *                     adminNotes:
 *                       type: array
 *       404:
 *         description: Support ticket not found
 *
 * /api/admin/ticket/{id}/assign:
 *   post:
 *     summary: Assign a support ticket to another admin
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
 *               - assignedToId
 *             properties:
 *               assignedToId:
 *                 type: string
 *                 description: ID of the admin to assign the ticket to
 *               message:
 *                 type: string
 *                 description: Optional message for the assignment
 *     responses:
 *       200:
 *         description: Ticket assigned successfully
 *       404:
 *         description: Ticket or admin not found
 *       403:
 *         description: Unauthorized
 *
 * /api/admin/ticket/{id}/status:
 *   put:
 *     summary: Update the status of a support ticket
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, resolved, closed]
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
 */

//  * /api/admin/ticket/{id}/delete:
//  *   delete:
//  *     summary: Delete a support ticket
//  *     tags: [Support Tickets]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: Ticket ID
//  *     responses:
//  *       200:
//  *         description: Support ticket deleted successfully
//  *       404:
//  *         description: Support ticket not found

router.get("/all-tickets", authorizeRoles(...ADMIN_ONLY_ROLES), getAllTickets);
router.get(
  "/:id",
  authorizeRoles(...ADMIN_ONLY_ROLES),
  validateTicketId,
  getTicketById
);
router.post(
  "/:id/assign",
  authorizeRoles(...ADMIN_ONLY_ROLES),
  validateAssignTicket,
  assignTicket
);
router.post(
  "/:id/admin-notes",
  authorizeRoles(...ADMIN_ONLY_ROLES),
  validateAddAdminNotes,
  addAdminNotes
);
router.patch(
  "/:id/status",
  authorizeRoles(...ADMIN_ONLY_ROLES),
  validateUpdateTicketStatus,
  updateTicketStatus
);

export default router;
