import Express from "express";
import { moderateProductListing, getProductsByAdmin, flagOrRemoveListing } from "../../controllers/admin/productController";
import { validateModeration, validateFlagOrRemove } from "../../middlewares/validators";
import { authorizeRoles } from "../../middlewares/authMiddleware";
import { ADMIN_ONLY_ROLES } from "../../constant";
import { verifyToken } from "../../middlewares/authMiddleware";
// import { asyncHandler } from "../../utils/asyncHandler";

const router = Express.Router();

/**
 * @swagger
 * /api/admin/product/moderate-product/{id}:
 *   patch:
 *     tags: [Admin Product Management]
 *     summary: Approve or Reject a product listing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID to moderate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               reason:
 *                 type: string
 *                 description: Required if action is 'reject'
 *     responses:
 *       200:
 *         description: Product successfully moderated
 *       400:
 *         description: Bad Request (e.g., missing reason)
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Product or Admin not found
 * 
 *  /api/admin/product/allproducts:
 *   get:
 *     tags: [Admin Product Management]
 *     summary: Get all product listings as admin
 *     description: Retrieve all products from admin perspective
 *     responses:
 *       200:
 *         description: All product listings retrieved successfully
 *       400:
 *         description: Not found
 *
 * 
 * /api/admin/product/flag/{productId}:
 *   patch:
 *     tags:
 *       - Admin Product Management
 *     summary: Flag or Remove a product listing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [flag, remove]
 *               reason:
 *                 type: string
 *                 description: Required if action is 'flag'
 *     responses:
 *       200:
 *         description: Product flagged or removed
 *       400:
 *         description: Invalid action or missing reason
 *       404:
 *         description: Product not found
 */





router.patch('/moderate-product/:id',
  verifyToken,
  authorizeRoles(...ADMIN_ONLY_ROLES), 
  validateModeration, 
  moderateProductListing
);

router.get('/allproducts', 
  verifyToken,  
  authorizeRoles(...ADMIN_ONLY_ROLES), 
  getProductsByAdmin
);

router.patch('/flag/:productId', 
  verifyToken,
  authorizeRoles(...ADMIN_ONLY_ROLES),  
  validateFlagOrRemove, 
  flagOrRemoveListing
);

export default router;

