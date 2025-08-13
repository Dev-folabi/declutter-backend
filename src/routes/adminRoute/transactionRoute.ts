import express from "express";
import { getAllTransactions }  from "../../controllers/admin/transactionController";
import { approveOrRejectRefund } from "../../controllers/admin/transactionController";
import { authorizeRoles } from "../../middlewares/authMiddleware";
import { ADMIN_ONLY_ROLES } from "../../constant";
import { validateTransactionId } from "../../middlewares/validators";

/**
 * @swagger
 * tags:
 *   name: Admin Transactions
 *   description: Endpoints for managing and moderating transactions by admin users.
 */

/**
 * @swagger
 * /api/admin/transactions:
 *   get:
 *     summary: Get all transactions
 *     description: Retrieves a paginated list of transactions with optional filters (status, type, date, user).
 *     tags: [Admin Transaction management]
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
 *           example: refunded
 *         description: Filter by transaction status.
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           example: purchase
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
 *         description: Start date for filtering transactions.
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering transactions.
 *     responses:
 *       200:
 *         description: List of transactions retrieved successfully.
 *       401:
 *         description: Unauthorized - invalid or missing token.
 *       403:
 *         description: Forbidden - admin-only access.
 */

/**
 * @swagger
 * /api/admin/transactions/{transactionId}/status:
 *   patch:
 *     summary: Approve or reject a refund request
 *     description: Updates the status of a transaction refund request and notifies the user via email.
 *     tags: [Admin Transaction management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the transaction to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 description: Action to take on the refund request.
 *                 example: approve
 *     responses:
 *       200:
 *         description: Refund request processed successfully.
 *       400:
 *         description: Invalid transaction status or action.
 *       404:
 *         description: Transaction or user not found.
 *       401:
 *         description: Unauthorized - invalid or missing token.
 *       403:
 *         description: Forbidden - admin-only access.
 */

const router = express.Router();
router.get("/",
  authorizeRoles(...ADMIN_ONLY_ROLES),
  getAllTransactions
) 

router.patch("/:transactionId/status",
  authorizeRoles(...ADMIN_ONLY_ROLES), 
  validateTransactionId,
  approveOrRejectRefund
); 

export default router