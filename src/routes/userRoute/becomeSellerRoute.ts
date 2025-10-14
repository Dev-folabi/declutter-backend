import express from "express";
import { becomeSeller } from "../../controllers/userController";
import { validateBecomeSeller } from "../../middlewares/validators";
import { authorizeRoles, verifyToken } from "../../middlewares/authMiddleware";
import { uploadFields } from "../../middlewares/upload";

const router = express.Router();

/**
 * @swagger
 * /api/user/become-seller:
 *   post:
 *     tags: [User]
 *     summary: Apply to become a seller
 *     description: Allows a buyer to apply to become a seller by submitting required documents and information.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - accountNumber
 *               - bankCode
 *               - pin
 *               - schoolIdCard
 *               - nin
 *             properties:
 *               accountNumber:
 *                 type: string
 *               bankCode:
 *                 type: string
 *               pin:
 *                 type: string
 *               schoolIdCard:
 *                 type: string
 *                 format: binary
 *               nin:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Seller application submitted successfully.
 *       400:
 *         description: Bad request, user is already a seller, or missing required fields.
 *       401:
 *         description: Unauthorized, token is missing or invalid.
 *       404:
 *         description: User not found.
 */
router.post(
  "/become-seller",
  verifyToken,
  authorizeRoles("buyer"),
  uploadFields([
    { name: "schoolIdCard", maxCount: 1 },
    { name: "nin", maxCount: 1 },
  ]),
  validateBecomeSeller,
  becomeSeller
);

export default router;