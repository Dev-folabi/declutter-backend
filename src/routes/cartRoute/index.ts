import express from "express";
import {
  getUserCart,
  removeItemFromCart,
  addToCart,
  updateCartItem,
} from "../../controllers/cartController";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Cart management and operations
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get the user's cart
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Cart retrieved successfully.
 *       400:
 *         description: Unauthenticated user or other errors.
 */

/**
 * @swagger
 * /api/cart/remove/{product_id}:
 *   delete:
 *     summary: Remove an item from the user's cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: product_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the product to remove
 *     responses:
 *       200:
 *         description: Item removed successfully.
 *       400:
 *         description: Product not found in the cart or unauthenticated user.
 */

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Add a product to the user's cart
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Product added to cart successfully.
 *       400:
 *         description: Product not found or unauthenticated user.
 */

/**
 * @swagger
 * /api/cart/update:
 *   patch:
 *     summary: Update the quantity of a product in the user's cart
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Product updated in cart successfully.
 *       400:
 *         description: Product not found in the cart or unauthenticated user.
 */

router.get("/", getUserCart);
router.delete("/remove/:product_id", removeItemFromCart);
router.post("/add", addToCart);

router.patch("/update", updateCartItem);

export default router;
