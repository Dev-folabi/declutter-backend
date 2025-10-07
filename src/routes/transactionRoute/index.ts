import express from "express";
import {
  getAllTransactions,
  getTransactionById,
  approveOrRejectRefund,
  getRefundHistory,
  getUserTransactions,
  getUserRefundStatus,
  createRefundRequest,
  getAllRefundRequests,
} from "../../controllers/transactionController";
import { authorizeRoles, verifyToken } from "../../middlewares/authMiddleware";
import { ADMIN_ONLY_ROLES } from "../../constant";
import { validateTransactionId } from "../../middlewares/validators";

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction management endpoints for users and admin users
 */

/**
 * @swagger
 * /api/transactions/user:
 *   get:
 *     summary: Get user's own transactions
 *     description: Retrieves a paginated list of transactions for the authenticated user with optional filters. User access required.
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
 *         description: User transactions retrieved successfully.
 *       401:
 *         description: Unauthorized - invalid or missing token.
 *
 * /api/transactions/user/{transactionId}/refund-status:
 *   get:
 *     summary: Get refund status for user's transaction
 *     description: Retrieves the refund status and history for a specific transaction owned by the authenticated user. User access required.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the transaction to get refund status for.
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       200:
 *         description: Refund status retrieved successfully.
 *       403:
 *         description: Forbidden - user can only view their own transactions.
 *       404:
 *         description: Transaction not found.
 *       401:
 *         description: Unauthorized - invalid or missing token.
 *
 * /api/transactions/refund-request/{transactionId}:
 *   post:
 *     tags: [Transactions]
 *     summary: Request refund for a transaction
 *     description: Allows authenticated users to request a refund for their completed transactions. Users can only request refunds for their own transactions.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the transaction to request refund for
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for requesting the refund
 *                 example: "Product was damaged upon delivery"
 *                 minLength: 10
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Refund request submitted successfully
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
 *                   example: "Refund request submitted successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionId:
 *                       type: string
 *                     refundStatus:
 *                       type: string
 *                       example: "pending"
 *                     refundRequest:
 *                       type: object
 *                       properties:
 *                         reason:
 *                           type: string
 *                         requestedBy:
 *                           type: string
 *                         requestedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Invalid request - transaction not eligible for refund or refund already requested
 *       403:
 *         description: Forbidden - user can only request refunds for their own transactions
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized - invalid or missing token
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

/**
 * @swagger
 * /api/transactions/refund-requests:
 *   get:
 *     summary: Get all refund requests (Admin only)
 *     description: Retrieves a paginated list of all refund requests with optional filters. Includes summary statistics. Admin access required.
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
 *         description: Number of refund requests per page.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, processed]
 *           example: pending
 *         description: Filter by refund status.
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
 *         description: Start date for filtering refund requests (YYYY-MM-DD).
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-12-31"
 *         description: End date for filtering refund requests (YYYY-MM-DD).
 *     responses:
 *       200:
 *         description: Refund requests retrieved successfully.
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
 *                   example: "Refund requests retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           userId:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               fullName:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                           amount:
 *                             type: number
 *                           transactionDate:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *                           refundStatus:
 *                             type: string
 *                           refundRequest:
 *                             type: object
 *                             properties:
 *                               reason:
 *                                 type: string
 *                               requestedBy:
 *                                 type: object
 *                                 properties:
 *                                   _id:
 *                                     type: string
 *                                   fullName:
 *                                     type: string
 *                                   email:
 *                                     type: string
 *                               requestedAt:
 *                                 type: string
 *                                 format: date-time
 *                               adminNotes:
 *                                 type: string
 *                           refundHistory:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 action:
 *                                   type: string
 *                                 performedBy:
 *                                   type: object
 *                                   properties:
 *                                     fullName:
 *                                       type: string
 *                                     email:
 *                                       type: string
 *                                 performedAt:
 *                                   type: string
 *                                   format: date-time
 *                                 notes:
 *                                   type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *                 summary:
 *                   type: object
 *                   properties:
 *                     pending:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                         totalAmount:
 *                           type: number
 *                     approved:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                         totalAmount:
 *                           type: number
 *                     rejected:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                         totalAmount:
 *                           type: number
 *                     processed:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                         totalAmount:
 *                           type: number
 *       401:
 *         description: Unauthorized - invalid or missing token.
 *       403:
 *         description: Forbidden - admin-only access.
 */

/**
 * @swagger
 * /api/transactions/{transactionId}:
 *   get:
 *     summary: Get a single transaction by ID
 *     description: Retrieves detailed information for a single transaction. Accessible by admins or the user who owns the transaction.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the transaction to retrieve.
 *         example: "60f7b3b3b3b3b3b3b3b3b3b3"
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully.
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
 *                   example: "Transaction retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction:
 *                       $ref: '#/components/schemas/Transaction'
 *                     orderDetails:
 *                       type: object
 *                       description: "Details of the order related to this transaction, if applicable."
 *       401:
 *         description: Unauthorized - invalid or missing token.
 *       403:
 *         description: Forbidden - user is not authorized to view this transaction.
 *       404:
 *         description: Transaction not found.
 */

const router = express.Router();

// User endpoints (require authentication)
router.get("/user", verifyToken, getUserTransactions);
router.get(
  "/user/:transactionId/refund-status",
  verifyToken,
  validateTransactionId,
  getUserRefundStatus
);
// Refund request endpoint (requires authentication)
router.post("/refund-request/:transactionId", verifyToken, createRefundRequest);

// Admin endpoints (require admin authentication)
router.get(
  "/:transactionId",
  verifyToken,
  validateTransactionId,
  getTransactionById
);
router.get("/", authorizeRoles(...ADMIN_ONLY_ROLES), getAllTransactions);
router.get(
  "/refund-requests",
  authorizeRoles(...ADMIN_ONLY_ROLES),
  getAllRefundRequests
);
router.patch(
  "/:transactionId/refund-status",
  authorizeRoles(...ADMIN_ONLY_ROLES),
  validateTransactionId,
  approveOrRejectRefund
);
router.get(
  "/:transactionId/refund-history",
  authorizeRoles(...ADMIN_ONLY_ROLES),
  getRefundHistory
);

export default router;
