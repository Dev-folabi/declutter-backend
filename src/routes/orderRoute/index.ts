import express from "express";
import {
  getOrderItems,
  getUserOrders,
  orderCheckout,
} from "../../controllers/orderController";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management and operations
 *
 * /api/order/orders/{order_id}/items:
 *   get:
 *     summary: Retrieve items for a specific order
 *     description: Fetches all items in a user's specific order.
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved order items.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Order items retrieved successfully." }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product:
 *                         $ref: '#/components/schemas/Product'
 *                       quantity: { type: number, example: 2 }
 *                       price: { type: number, example: 5000 }
 *       400:
 *         description: Authentication error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 message: { type: string, example: "You need to be authenticated to perform this action." }
 *                 data: { type: null }
 *       404:
 *         description: Order not found or access denied.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 message: { type: string, example: "Order not found or you do not have access to this order." }
 *                 data: { type: null }
 *
 * /api/order:
 *   get:
 *     summary: Retrieve all orders for the authenticated user
 *     description: Returns a list of all orders placed by the user.
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved orders.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Orders retrieved successfully." }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id: { type: string, example: "6612a97c3d87a8b5c9c3456f" }
 *                       user: { type: string, example: "660e5b1234567f18c9d123ab" }
 *                       totalPrice: { type: number, example: 300 }
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             product:
 *                               type: object
 *                               properties:
 *                                 _id: { type: string, example: "660e5b6c234567890abcdef1" }
 *                                 title: { type: string, example: "Bluetooth Headphones" }
 *                                 price: { type: number, example: 150 }
 *                                 image: { type: string, example: "headphones.jpg" }
 *                             quantity: { type: number, example: 2 }
 *                             price: { type: number, example: 300 }
 *                       createdAt: { type: string, format: date-time, example: "2025-04-09T14:00:00.000Z" }
 *       401:
 *         description: Unauthorized user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 message: { type: string, example: "You need to be authenticated to perform this action." }
 *                 data: { type: null }
 *
 * /api/order/checkout:
 *   post:
 *     summary: Checkout and place a new order
 *     description: Converts all cart items into an order and reserves the products.
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Order placed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Order created successfully." }
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id: { type: string, example: "6619b97c6b12a3a0c7123456" }
 *                     user: { type: string, example: "660e5b1234567f18c9d123ab" }
 *                     totalPrice: { type: number, example: 500 }
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product: { type: string, example: "660e5b6c234567890abcdef1" }
 *                           quantity: { type: number, example: 2 }
 *                           price: { type: number, example: 250 }
 *                     createdAt: { type: string, format: date-time, example: "2025-04-09T14:00:00.000Z" }
 *       400:
 *         description: Cart is empty or contains invalid products.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 message: { type: string, example: "Cart is empty." }
 *                 data: { type: null }
 *       401:
 *         description: Unauthorized user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 message: { type: string, example: "Unauthenticated user cannot create an order." }
 *                 data: { type: null }
 */

// Get all orders for the authenticated user
router.get("/", getUserOrders);

// Get items in a specific order
router.get("/orders/:order_id/items", getOrderItems);

// Checkout cart and create an order
router.post("/checkout", orderCheckout);

export default router;
