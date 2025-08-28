import express from "express";
import {
  validateCreateProduct,
  validateProductListing,
  validateProductUpdate,
  validateUpdateProduct,
} from "../../middlewares/validators";
import { uploadMultiple } from "../../middlewares/upload";

import {
  getSingleUnsoldProduct,
  getAllUnsoldProduct,
  listAProduct,
  updateAProduct,
  getUnsoldProductsByCategory,
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - location
 *               - description
 *               - category
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
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Product images (up to 10 files)
 *                 maxItems: 10
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
 *         multipart/form-data:
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
 *                 enum: [electronics, books & stationery, clothing & accessories, furniture, home & kitchen, sports & fitness equipment, gaming & entertainment, health & personal care, hobbies & crafts, miscellaneous]
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Updated product images (up to 10 files)
 *                 maxItems: 10
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid data
 *
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
  verifyToken,
  uploadMultiple("files", 10),
  validateCreateProduct,
  listAProduct
);
router.patch(
  "/updateproduct/:id",
  verifyToken,
  uploadMultiple("files", 10),
  validateUpdateProduct,
  updateAProduct
);

export default router;
