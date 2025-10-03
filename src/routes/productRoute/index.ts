import express from "express";
import {
  validateCreateProduct,
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
  getSellerProducts,
} from "../../controllers/productController";
import { authorizeRoles, verifyToken } from "../../middlewares/authMiddleware";
import { ADMIN_ONLY_ROLES } from "../../constant";
import { getCategory } from "../../controllers/categoryController";

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
 * /api/product/my-products:
 *   get:
 *     summary: Get all products for the authenticated seller
 *     description: Retrieve all products (approved and unapproved) belonging to the authenticated seller
 *     tags: [Product]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of products per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter products by name, category, or description
 *     responses:
 *       200:
 *         description: Products retrieved successfully
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
 *                   example: "Products retrieved successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalProducts:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         approved:
 *                           type: integer
 *                         unapproved:
 *                           type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
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
 *               - categoryId
 *               - phoneNumber
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 description: The number of items available for sale. Defaults to 1 if not provided.
 *                 example: 5
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number must be in international format
 *                 example: "+2348012345678"
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
 *               categoryId:
 *                 type: string
 *                 enum: [electronics, books & stationery, clothing & accessories, furniture, home & kitchen, sports & fitness equipment, gaming & entertainment, health & personal care, hobbies & crafts, miscellaneous]
 *               quantity:
 *                 type: integer
 *                 description: The updated number of items available for sale.
 *                 example: 10
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
router.get("/my-products", verifyToken, getSellerProducts);
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

/**
 * @swagger
 * /api/admin/category:
 *   get:
 *     summary: Get all categories
 *     description: Allows an admin to retrieve all categories.
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
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
 *       401:
 *         description: Unauthorized (not an admin)
 */
router.get("/",  getCategory);
export default router;
