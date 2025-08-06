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
 *               - isApproved
 *             properties:
 *               isApproved:
 *                 type: boolean
 *                 enum: [true, false]
 *                 description: Set to true to approve or false to reject
 *               reason:
 *                 type: string
 *                 description: Required when rejecting the product (isApproved: false)
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
 *     security:
 *      - bearerAuth: []
 *     parameters: 
 *      - in: query
 *        name: page
 *     schema:
 *       type: integer
 *       default: 1
 *      description: Page number for pagination
 *    - in: query
 *      name: limit
 *     schema:
 *      type: integer
 *      default: 10
 *    description: Number of products per page
 *    - in: query
 *      name: search
 *         schema:
 *           type: string
 *         description: Search term to match name, category, or description
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
  authorizeRoles(...ADMIN_ONLY_ROLES), 
  validateModeration, 
  moderateProductListing
);

router.get('/allproducts', 
  authorizeRoles(...ADMIN_ONLY_ROLES), 
  getProductsByAdmin
);

router.patch('/flag/:productId', 
  authorizeRoles(...ADMIN_ONLY_ROLES),  
  validateFlagOrRemove, 
  flagOrRemoveListing
);

export default router;

