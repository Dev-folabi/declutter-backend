import express from "express";
import { getCategory } from "../../controllers/categoryController";

const router = express.Router();

/**
 * @swagger
 * /api/category/:
 *   get:
 *     summary: Get all categories
 *     description: Retrieve a list of all product categories. This endpoint is public and can be accessed by any user.
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
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
 *                   example: Categories retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       500:
 *         description: Internal server error
 */


router.get('/', getCategory);

export default router;
