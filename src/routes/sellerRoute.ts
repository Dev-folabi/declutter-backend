import express from "express";
import {
  getSellerSalesHistory,
  getSellerWithdrawalHistory,
} from "../controllers/transactionController";
import { authorizeRoles, verifyToken } from "../middlewares/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Seller
 *   description: Seller-specific endpoints
 */

/**
 * @swagger
 * /api/seller/sales:
 *   get:
 *     summary: Get seller's sales history
 *     description: Retrieves a paginated list of sales for the authenticated seller, with optional status filtering.
 *     tags: [Seller]
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
 *         description: Number of sales per page.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by order status.
 *     responses:
 *       200:
 *         description: Seller's sales history retrieved successfully.
 *       401:
 *         description: Unauthorized - invalid or missing token.
 *       403:
 *         description: Forbidden - user is not a seller.
 */
router.get(
  "/sales",
  verifyToken,
  authorizeRoles("seller"),
  getSellerSalesHistory
);

/**
 * @swagger
 * /api/seller/withdrawals:
 *   get:
 *     summary: Get seller's withdrawal history
 *     description: Retrieves a paginated list of withdrawals for the authenticated seller.
 *     tags: [Seller]
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
 *         description: Number of withdrawals per page.
 *     responses:
 *       200:
 *         description: Seller's withdrawal history retrieved successfully.
 *       401:
 *         description: Unauthorized - invalid or missing token.
 *       403:
 *         description: Forbidden - user is not a seller.
 */
router.get(
  "/withdrawals",
  verifyToken,
  authorizeRoles("seller"),
  getSellerWithdrawalHistory
);

export default router;
