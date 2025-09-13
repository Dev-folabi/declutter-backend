import { Router } from 'express';
import { verifyToken } from "../../middlewares/authMiddleware";
import { getSellerDashboard } from '../../controllers/dashboardController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Seller dashboard operations
 */

/**
 * @swagger
 * /dashboard/seller:
 *   get:
 *     summary: Get seller dashboard data
 *     description: Retrieves dashboard data for the authenticated seller, including sales summary, item counts, withdrawal history, and sales history.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination of history lists.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page for history lists.
 *     responses:
 *       200:
 *         description: Seller dashboard data retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         sales:
 *                           type: number
 *                         totalUploadedItems:
 *                           type: integer
 *                         availableItems:
 *                           type: integer
 *                         soldItems:
 *                           type: integer
 *                     withdrawalHistory:
 *                       $ref: '#/components/schemas/PaginatedTransactions'
 *                     salesHistory:
 *                       $ref: '#/components/schemas/PaginatedOrders'
 *       403:
 *         description: Access denied. User is not a seller.
 *       500:
 *         description: Internal server error.
 */
router.get(
  '/seller',
  verifyToken,
  getSellerDashboard
);

export default router;
