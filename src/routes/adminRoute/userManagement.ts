import express from "express";
import {
  getAllUsers,
  verifySellerDocuments,
  updateUserStatus,
} from "../../controllers/admin/userManagement";
import { validateVerificationRequest } from "../../middlewares/validators";
import { validateStatusUpdate } from "../../middlewares/validators";
import { authorizeRoles } from "../../middlewares/authMiddleware";
import { ADMIN_ONLY_ROLES } from "../../constant";

const router = express.Router();
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [User Management]
 *     summary: Get all users
 *     description: Admin can fetch a paginated list of users with optional filters like status, verification status, role, and search.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *         required: false
 *         description: Page number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *         required: false
 *         description: Number of users per page
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         required: false
 *         description: Filter by account status
 *       - name: sellerStatus
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, not enroll]
 *         required: false
 *         description: Filter by seller status
 *       - name: roles
 *         in: query
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by role
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         required: false
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *
 * /api/admin/users/{userId}/verify-seller:
 *   patch:
 *     tags: [User Management]
 *     summary: Verify or reject seller documents
 *     description: Admin verifies or rejects a seller's application and sends an email notification.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to verify
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               reason:
 *                 type: string
 *                 description: Reason for rejection (required if status is rejected)
 *               comment:
 *                 type: string
 *                 description: Optional admin comment
 *     responses:
 *       200:
 *         description: Seller verification updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *
 * /api/admin/users/{userId}/status:
 *   patch:
 *     tags: [User Management]
 *     summary: Activate or suspend user account
 *     description: Admin can change a user's account status to active, inactive, or suspended.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *                 description: New status to apply
 *               note:
 *                 type: string
 *                 description: Optional admin note or reason
 *     responses:
 *       200:
 *         description: User status updated
 *       400:
 *         description: Invalid status or bad request
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */

router.get("/", authorizeRoles(...ADMIN_ONLY_ROLES), getAllUsers);
router.patch(
  "/:userId/verify-seller",
  authorizeRoles(...ADMIN_ONLY_ROLES),
  validateVerificationRequest,
  verifySellerDocuments
);
router.patch(
  "/:userId/status",
  authorizeRoles(...ADMIN_ONLY_ROLES),
  validateStatusUpdate,
  updateUserStatus
);

export default router;
