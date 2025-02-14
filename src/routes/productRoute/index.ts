import express from "express";
import {
  validateProductListing,
  validateProductUpdate,
} from "../../middlewares/validators";

import { 
  getSingleUnsoldProduct, 
  getAllUnsoldProduct,
  listAProduct,
  updateAProduct
} from "../../controllers/productController";

const router = express.Router();

/**
 * @swagger
 * /api/product/allproducts:
 *   get:
 *     tags: [Product]
 *     summary: Get all Product listings
 *     description: Get all Product listings
 *     responses:
 *       200:
 *         description: All Product listings retrieved successfully
 *       400:
 *         description: Not found
 *
 * /api/product/product/id:
 *   get:
 *     tags: [Product]
 *     summary: Get all Product listings
 *     description: Get all Product listings
 *     responses:
 *       200:
 *         description: All Product listings retrieved successfully
 *       400:
 *         description: Not found
 *
 * /api/product/createproduct:
 *   post:
 *     tags: [Product]
 *     summary: List a Product
 *     description: Create a new product to sell
 *     parameters:
 *       - in: body
 *         name: updateProduct
 *         description: Update a product
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             price:
 *               type: string
 *             location:
 *               type: string
 *             description:
 *               type: string
 *             category:
 *               type: string
 *               enum: [electronics, books & stationery, clothing & accessories, furniture, home & kitchen, sports & fitness equipment, gaming & entertainment, health & personal care, hobbies & crafts, miscellaneous]
 *     responses:
 *       200:
 *         description: Product created successfully
 *       400:
 *         description: Invalid data
 * 
 * /api/product/updateproduct/id:
 *   patch:
 *     tags: [Product]
 *     summary: Update a Product
 *     description: Update a product
 *     parameters:
 *       - in: body
 *         name: updateProduct
 *         description: Update a product
 *         required: false
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             price:
 *               type: string
 *             location:
 *               type: string
 *             description:
 *               type: string
 *             category:
 *               type: string
 *               enum: [electronics, books & stationery, clothing & accessories, furniture, home & kitchen, sports & fitness equipment, gaming & entertainment, health & personal care, hobbies & crafts, miscellaneous]
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid data
 */




router.get("/allproducts", getAllUnsoldProduct);
router.get("/product/:id", getSingleUnsoldProduct);
router.post("/createproduct", validateProductListing, listAProduct);
router.patch("/updateproduct/:id", validateProductUpdate, updateAProduct);

export default router;
