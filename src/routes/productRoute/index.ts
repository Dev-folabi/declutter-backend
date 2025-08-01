import express from "express";
import {
  validateProductListing,
  validateProductUpdate,
} from "../../middlewares/validators";

import {
  getSingleUnsoldProduct,
  getAllUnsoldProduct,
  listAProduct,
  updateAProduct,
  getUnsoldProductsByCategory,
  getProductsByAdmin,
  approveAProduct,
  getAllLongUnsoldProduct,
} from "../../controllers/productController";
import { authorizeRoles, verifyToken } from "../../middlewares/authMiddleware";
import { ADMIN_ONLY_ROLES } from "../../constant";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Product
 *     description: Manage product listings
 *
 * /api/product/allproducts:
 *   get:
 *     tags: [Product]
 *     summary: Get all product listings
 *     description: Retrieve all product listings
 *     responses:
 *       200:
 *         description: All product listings retrieved successfully
 *       400:
 *         description: Error retrieving products
 *
 * /api/product/product/{id}:
 *   get:
 *     tags: [Product]
 *     summary: Get a single product by ID
 *     description: Retrieve details of a product using its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       400:
 *         description: Product not found
 *
 * /api/product/productincategory/{category}:
 *   get:
 *     tags: [Product]
 *     summary: Get all products in a specific category
 *     description: Retrieve product listings by category
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Product category
 *     responses:
 *       200:
 *         description: Product listings retrieved successfully
 *       400:
 *         description: Category not found
 *
 * /api/product/createproduct:
 *   post:
 *     tags: [Product]
 *     summary: Create a new product listing
 *     description: Add a product to the marketplace
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - location
 *               - description
 *               - category
 *               - productImage
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum:
 *                   - electronics
 *                   - books & stationery
 *                   - clothing & accessories
 *                   - furniture
 *                   - home & kitchen
 *                   - sports & fitness equipment
 *                   - gaming & entertainment
 *                   - health & personal care
 *                   - hobbies & crafts
 *                   - miscellaneous
 *                 productImage:
 *                  type: array
 *                  items:
 *                    type: string
 *     responses:
 *       200:
 *         description: Product created successfully
 *       400:
 *         description: Invalid data
 *
 * /api/product/updateproduct/{id}:
 *   patch:
 *     tags: [Product]
 *     summary: Update a product listing
 *     description: Modify an existing product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum:
 *                   - electronics
 *                   - books & stationery
 *                   - clothing & accessories
 *                   - furniture
 *                   - home & kitchen
 *                   - sports & fitness equipment
 *                   - gaming & entertainment
 *                   - health & personal care
 *                   - hobbies & crafts
 *                   - miscellaneous
 *                 productImage:
 *                  type: array
 *                  items:
 *                    type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid data
 *
 * /api/product/admin/approveproduct/{id}:
 *   patch:
 *     tags: [Product]
 *     summary: Approve a product
 *     description: Admin approves a product listing
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product approved successfully
 *       400:
 *         description: Approval failed or product not found
 *
 * /api/product/admin/allproducts:
 *   get:
 *     tags: [Product]
 *     summary: Get all product listings as admin
 *     description: Retrieve all products from admin perspective
 *     responses:
 *       200:
 *         description: All product listings retrieved successfully
 *       400:
 *         description: Not found
 *
 * /api/product/to-own:
 *   get:
 *     tags: [Product]
 *     summary: Get all products listed for a long time
 *     description: Retrieve products that have been listed for a long duration
 *     responses:
 *       200:
 *         description: Product listings retrieved successfully
 *       400:
 *         description: Not found
 */

router.get("/allproducts", getAllUnsoldProduct);
router.get("/to-own", getAllLongUnsoldProduct);
router.get("/productincategory/:category", getUnsoldProductsByCategory);
router.get("/product/:id", getSingleUnsoldProduct);
router.post(
  "/createproduct",
  validateProductListing,
  verifyToken,
  authorizeRoles("seller"),
  listAProduct
);
router.patch(
  "/updateproduct/:id",
  validateProductUpdate,
  verifyToken,
  authorizeRoles("seller"),
  updateAProduct
);
router.get(
  "/admin/allproducts",
  verifyToken,
  authorizeRoles(...ADMIN_ONLY_ROLES),
  getProductsByAdmin
);
router.patch(
  "/admin/approveproduct/:id",
  validateProductUpdate,
  verifyToken,
  authorizeRoles(...ADMIN_ONLY_ROLES),
  approveAProduct
);

export default router;
