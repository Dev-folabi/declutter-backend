import express from "express";
import { getAllTransactions, approveOrRejectRefund, getRefundHistory } from "../../controllers/transactionController";
import { authorizeRoles } from "../../middlewares/authMiddleware";
import { ADMIN_ONLY_ROLES } from "../../constant";
import { validateTransactionId } from "../../middlewares/validators";

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction management endpoints for admin users
 */

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions
 *     description: Retrieves a paginated list of transactions with optional filters (status, type, date, user). Admin access required.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of transactions per page.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refund, refunded]
 *           example: completed
 *         description: Filter by transaction status.
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [credit, debit]
 *           example: debit
 *         description: Filter by transaction type.
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID.
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *         description: Start date for filtering transactions (YYYY-MM-DD).
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-12-31"
 *         description: End date for filtering transactions (YYYY-MM-DD).
 *     responses:
 *       200:
 *         description: List of transactions retrieved successfully.
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
 *                   example: "Transactions fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           userId:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           status:
 *                             type: string
 *                           transactionType:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *       401:
 *         description: Unauthorized - invalid or missing token.
 *       403:
 *         description: Forbidden - admin-only access.
 */

/**
 * @swagger
 * /api/transactions/{transactionId}/refund-status:
 *   patch:
 *     summary: Approve or reject a refund request
 *     description: Updates the status of a transaction refund request, processes Paystack refund if approved, and notifies the user via email and in-app notification. Admin access required.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the transaction to update.
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 description: Action to take on the refund request.
 *                 example: approve
 *               adminNotes:
 *                 type: string
 *                 description: Optional notes from admin regarding the refund decision.
 *                 example: "Refund approved due to product defect"
 *     responses:
 *       200:
 *         description: Refund request processed successfully.
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
 *                   example: "Refund approved successfully. Paystack refund processed."
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction:
 *                       type: object
 *                       description: Updated transaction object
 *                     paystackRefund:
 *                       type: object
 *                       description: Paystack refund response (if applicable)
 *       400:
 *         description: Invalid transaction status, action, or refund already processed.
 *       404:
 *         description: Transaction or user not found.
 *       401:
 *         description: Unauthorized - invalid or missing token.
 *       403:
 *         description: Forbidden - admin-only access.
 */

/**
 * @swagger
 * /api/transactions/{transactionId}/refund-history:
 *   get:
 *     summary: Get refund history for a transaction
 *     description: Retrieves the complete refund history including request details, approval/rejection status, and processing information. Admin access required.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the transaction to get refund history for.
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       200:
 *         description: Refund history retrieved successfully.
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
 *                   example: "Refund history retrieved successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionId:
 *                       type: string
 *                     refundRequest:
 *                       type: object
 *                       properties:
 *                         reason:
 *                           type: string
 *                         requestedBy:
 *                           type: object
 *                           properties:
 *                             fullName:
 *                               type: string
 *                             email:
 *                               type: string
 *                         requestedAt:
 *                           type: string
 *                           format: date-time
 *                         adminNotes:
 *                           type: string
 *                     refundStatus:
 *                       type: string
 *                       enum: [pending, approved, rejected, processed]
 *                     refundDetails:
 *                       type: object
 *                       properties:
 *                         paystackRefundId:
 *                           type: string
 *                         refundAmount:
 *                           type: number
 *                         processedAt:
 *                           type: string
 *                           format: date-time
 *                         processedBy:
 *                           type: object
 *                           properties:
 *                             fullName:
 *                               type: string
 *                             email:
 *                               type: string
 *                     refundHistory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           action:
 *                             type: string
 *                           performedBy:
 *                             type: object
 *                             properties:
 *                               fullName:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                           performedAt:
 *                             type: string
 *                             format: date-time
 *                           notes:
 *                             type: string
 *       404:
 *         description: Transaction not found.
 *       401:
 *         description: Unauthorized - invalid or missing token.
 *       403:
 *         description: Forbidden - admin-only access.
 */

const router = express.Router();

// Get all transactions (admin only)
router.get("/",
  authorizeRoles(...ADMIN_ONLY_ROLES),
  getAllTransactions
);

// Approve or reject refund request (admin only)
router.patch("/:transactionId/refund-status",
  authorizeRoles(...ADMIN_ONLY_ROLES),
  validateTransactionId,
  approveOrRejectRefund
);

// Get refund history for a transaction (admin only)
router.get("/:transactionId/refund-history",
  authorizeRoles(...ADMIN_ONLY_ROLES),
  validateTransactionId,
  getRefundHistory
);

export default router;