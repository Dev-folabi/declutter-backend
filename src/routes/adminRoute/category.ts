import express from "express";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "../../controllers/categoryController";
import { authorizeRoles } from "../../middlewares/authMiddleware";
import { ADMIN_ONLY_ROLES } from "../../constant";
import { validateCreateCategory } from "../../middlewares/validators";

const router = express.Router();

/**
 * @swagger
 * api/admin/category/create:
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

router.put(
  "/:categoryId",
  authorizeRoles(...ADMIN_ONLY_ROLES),
  updateCategory
);
router.delete(
  "/:categoryId",
  authorizeRoles(...ADMIN_ONLY_ROLES),
  deleteCategory
);

export default router;