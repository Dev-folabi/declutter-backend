import express from "express";
import {
  getUserCart,
  addToCart,
  removeItemFromCart,
} from "../../controllers/cartController";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Cart
 *     description: Cart management and operations
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
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Add product to cart
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: string
 *               quantity:
 *                 type: number
 *             required:
 *               - product_id
 *     responses:
 *       201:
 *         description: Product added to cart
 */

/**
 * @swagger
 * /api/cart/remove/{product_id}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: product_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed
 */

// /**
//  * @swagger
//  * /api/cart/update:
//  *   patch:
//  *     summary: Update item quantity in cart
//  *     tags: [Cart]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               product_id:
//  *                 type: string
//  *               quantity:
//  *                 type: number
//  *             required:
//  *               - product_id
//  *               - quantity
//  *     responses:
//  *       200:
//  *         description: Cart updated
//  */

router.get("/", getUserCart);
router.post("/add", addToCart);
router.delete("/remove/:product_id", removeItemFromCart);

//  This endpoint has been deprecated. Add and Remove cart endpoint should be use instead.
// router.patch("/update", updateCartItem);

export default router;
