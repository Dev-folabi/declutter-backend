import express from 'express';
import { 
    createWeListened,
    getAllWeListened,
    removeWeListened,
    getWeListenedById,
    updateWeListened,
    deleteWeListened
} from '../../controllers/welistenedController';

const router = express.Router();

/**
 * @swagger
 * /api/welistened:
 *   post:
 *     tags: [WeListened]
 *     summary: Create a new WeListened message
 *     description: Create a new WeListened message
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Your message has been created successfully.
 *       400:
 *         description: Invalid data
 *
 * /api/allwelistened:
 *   get:
 *     tags: [WeListened]
 *     summary: Get all WeListened messages
 *     description: Retrieve all WeListened messages
 *     responses:
 *       200:
 *         description: WeListened retrieved successfully.
 *       400:
 *         description: Error retrieving data
 *
 * /api/welistened/{id}:
 *   get:
 *     tags: [WeListened]
 *     summary: Get a WeListened message by ID
 *     description: Retrieve a specific WeListened message by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the WeListened message
 *     responses:
 *       200:
 *         description: WeListened retrieved successfully.
 *       404:
 *         description: WeListened not found
 *
 * /api/update-welistened/{id}:
 *   patch:
 *     tags: [WeListened]
 *     summary: Update a WeListened message by ID
 *     description: Update a specific WeListened message by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the WeListened message
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Your message has been updated successfully.
 *       404:
 *         description: WeListened not found
 *
 * /api/deleteWelistened/{id}:
 *   delete:
 *     tags: [WeListened]
 *     summary: Delete a WeListened message by ID
 *     description: Delete a specific WeListened message by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the WeListened message
 *     responses:
 *       200:
 *         description: WeListened deleted successfully.
 *       404:
 *         description: WeListened not found
 */




router.post("/welistened", createWeListened);
router.get("/allwelistened", getAllWeListened);
router.get("/welistened/:id", getWeListenedById);
router.delete("/deleteWelistened/:id", removeWeListened);
router.patch("/update-welistened/:id", updateWeListened);


export default router;
