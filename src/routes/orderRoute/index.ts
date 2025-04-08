import express from 'express';
import { 
    getUserOrders,
    getOrderItemsForanOrder
} from '../../controllers/orderController';

const router = express.Router();


/**
 * @swagger
 * /api/order/orders/{order_id}/items/:
 *   get:
 *     summary: Retrieve items for a specific order
 *     description: Fetches all items associated with a specific order for an authenticated user.
 *     tags:
 *       - Orders
 *     parameter:
 *       - in: param
 *         name: order_id
 *     responses:
 *       200:
 *         description: Successfully retrieved order items.
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
 *                   example: "Orders retrieved successfully."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Order item details.
 *       400:
 *         description: User is not authenticated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "You need to be authenticated to perform this action."
 *                 data:
 *                   type: null
 *       404:
 *         description: Order not found or access denied.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Order not found or you do not have access to this order."
 *                 data:
 *                   type: null
 * 
 * /api/order/orders:
 *   get:
 *     summary: Retrieve items for a specific order
 *     description: Fetches all items associated with a specific order for an authenticated user.
 *     tags:
 *       - Orders
 *     responses:
 *       200:
 *         description: Successfully retrieved order items.
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
 *                   example: "Orders retrieved successfully."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Order item details.
 *       400:
 *         description: User is not authenticated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "You need to be authenticated to perform this action."
 *                 data:
 *                   type: null
 *       404:
 *         description: Order not found or access denied.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Order not found or you do not have access to this order."
 *                 data:
 *                   type: null
 */



router.get("/orders", getUserOrders);
router.get("/orders/:order_id/items/", getOrderItemsForanOrder);

export default router;