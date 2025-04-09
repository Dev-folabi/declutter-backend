import express from "express";
import {
  getOrderItems,
  getUserOrders,
  orderCheckout,
} from "../../controllers/orderController";

const router = express.Router();

/**
 * @swagger
 * /api/order/orders/{order_id}/items:
 *   get:
 *     summary: Retrieve items for a specific order
 *     description: Fetches all items associated with a specific order for an authenticated user.
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order whose items you want to retrieve.
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
 *                   example: "Order items retrieved successfully."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product:
 *                         $ref: '#/components/schemas/Product'
 *                       quantity:
 *                         type: number
 *                         example: 2
 *                       price:
 *                         type: number
 *                         example: 5000
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

/**
 * @swagger
 * /api/order:
 *   get:
 *     summary: Retrieve all order items for a user (My Orders / Order History)
 *     description: Retrieves all orders placed by the authenticated user, including product details in each order.
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []  # If you're using JWT authentication
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
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "6612a97c3d87a8b5c9c3456f"
 *                       user:
 *                         type: string
 *                         example: "660e5b1234567f18c9d123ab"
 *                       totalPrice:
 *                         type: number
 *                         example: 300
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             product:
 *                               type: object
 *                               properties:
 *                                 _id:
 *                                   type: string
 *                                   example: "660e5b6c234567890abcdef1"
 *                                 title:
 *                                   type: string
 *                                   example: "Bluetooth Headphones"
 *                                 price:
 *                                   type: number
 *                                   example: 150
 *                                 image:
 *                                   type: string
 *                                   example: "headphones.jpg"
 *                             quantity:
 *                               type: number
 *                               example: 2
 *                             price:
 *                               type: number
 *                               example: 300
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-04-09T14:00:00.000Z"
 *       401:
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
 */

/**
 * @swagger
 * /api/order/checkout:
 *   post:
 *     summary: Checkout user's cart and create an order
 *     description: Converts all items in the authenticated user's cart into an order, reserves the products, and prepares for payment.
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []  # Assuming you're using JWT-based auth
 *     responses:
 *       201:
 *         description: Order created successfully and products reserved.
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
 *                   example: "Order created successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "6619b97c6b12a3a0c7123456"
 *                     user:
 *                       type: string
 *                       example: "660e5b1234567f18c9d123ab"
 *                     totalPrice:
 *                       type: number
 *                       example: 500
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product:
 *                             type: string
 *                             example: "660e5b6c234567890abcdef1"
 *                           quantity:
 *                             type: number
 *                             example: 2
 *                           price:
 *                             type: number
 *                             example: 250
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-04-09T14:00:00.000Z"
 *       400:
 *         description: Bad request - cart is empty or product not found.
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
 *                   example: "Cart is empty."
 *                 data:
 *                   type: null
 *       401:
 *         description: Unauthorized - user is not authenticated.
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
 *                   example: "Unauthenticated user cannot list a product."
 *                 data:
 *                   type: null
 */

router.get("/", getUserOrders);
router.get("/orders/:order_id/items/", getOrderItems);
router.post("/checkout", orderCheckout);

export default router;
