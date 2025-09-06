import express from "express";
import {
  createCategory,
  deleteCategory,
  getCategory,
  updateCategory,
} from "../../controllers/categoryController";
import { authorizeRoles } from "../../middlewares/authMiddleware";
import { ADMIN_ONLY_ROLES } from "../../constant";
import { validateCreateCategory } from "../../middlewares/validators";

const router = express.Router();


/**
 * @swagger
 * /api/admin/category/create:
 *   post:
 *     summary: Create a new category
 *     description: Allows an admin to create a category. Duplicate category names are not allowed.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Pizza"
 *               description:
 *                 type: string
 *                 example: "All pizza-related meals"
 *     responses:
 *       201:
 *         description: Category created successfully
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
 *                   example: Category created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Duplicate category or invalid data
 *       401:
 *         description: Unauthorized (not an admin)
 *
 */

router.post(
  "/create",
  validateCreateCategory,
  authorizeRoles(...ADMIN_ONLY_ROLES),
  createCategory
);

/**
 * @swagger
 * /api/admin/category/{categoryId}:
 *   put:
 *     summary: Update a category
 *     description: Allows an admin to update a category's name and description.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the category to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "New Pizza"
 *               description:
 *                 type: string
 *                 example: "All kinds of pizza"
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Invalid data or duplicate category name
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 */
router.put(
  "/:categoryId",
  authorizeRoles(...ADMIN_ONLY_ROLES),
  updateCategory
);

/**
 * @swagger
 * /api/admin/category/{categoryId}:
 *   delete:
 *     summary: Delete a category
 *     description: Allows an admin to delete a category. A category cannot be deleted if it is associated with any products.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the category to delete.
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       400:
 *         description: Category is associated with products
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 */
router.delete(
  "/:categoryId",
  authorizeRoles(...ADMIN_ONLY_ROLES),
  deleteCategory
);

export default router;