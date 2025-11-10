import express from "express";
import {
  getOrderItems,
  getUserOrders,
  orderCheckout,
  OrderAvailability
} from "../../controllers/orderController";
import { LOGISTIC_ONLY_ROLES } from "../../constant";
import { validateOrderAvailability } from "../../middlewares/validators";
import { authorizeRoles } from "../../middlewares/authMiddleware";
import { validateOrderCheckout } from "../../middlewares/validators";

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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deliveryType
 *             properties:
 *               deliveryType:
 *                 type: string
 *                 enum: [pickup, delivery]
 *                 description: The chosen method for receiving the order.
 *               deliveryAddress:
 *                 type: object
 *                 description: Required if deliveryType is 'delivery'.
 *                 properties:
 *                   location:
 *                     type: string
 *                     description: The delivery location.
 *                   landmark:
 *                     type: string
 *                     description: A nearby landmark.
 *                   primaryPhoneNumber:
 *                     type: string
 *                     description: The primary contact number.
 *                   secondaryPhoneNumber:
 *                     type: string
 *                     description: An optional secondary contact number.
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
 *
 * /api/order/{orderId}/availability:
 *   patch:
 *     summary: Update an order’s availability status
 *     description: >
 *       Allows an authenticated seller with *approved* status to mark an order as **available** or **unavailable**.
 *       If the order does not have an associated logistics document, one will be created automatically.
 *       The system will also notify all logistics agents and super admins about the update.
 *     tags:
 *       - Orders
 *     security:
 *       - bearerAuth: []   # JWT or Bearer token auth
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The custom order ID of the order.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isAvailable
 *             properties:
 *               isAvailable:
 *                 type: boolean
 *                 example: true
 *                 description: >
 *                   Set to **true** if the order is available (ready for pickup), or **false** if it’s unavailable (cancelled).
 *     responses:
 *       200:
 *         description: Order availability successfully updated and logistics agents notified.
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
 *                   example: "Order availability confirmed and updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: string
 *                       example: 6739dc217f0f1e8a5d1e9c9a
 *                     status:
 *                       type: string
 *                       example: "ready_for_pickup"
 *       400:
 *         description: Invalid input or unauthorized seller action.
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
 *                   example: "Invalid order or payment not completed."
 *       401:
 *         description: Unauthenticated user or invalid token.
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
 *                   example: "Unauthenticated user cannot perform this action."
 *       403:
 *         description: Forbidden - seller not approved or not authorized.
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
 *                   example: "Unapproved seller cannot perform this action."
 *       500:
 *         description: Internal server error.
 */

// Get all orders for the authenticated user
router.get("/", getUserOrders);

// Get items in a specific order
router.get("/orders/:order_id/items", getOrderItems);

// Checkout cart and create an order
router.post("/checkout", validateOrderCheckout, orderCheckout);

router.patch("/:orderId/availability", validateOrderAvailability, OrderAvailability)

export default router;
