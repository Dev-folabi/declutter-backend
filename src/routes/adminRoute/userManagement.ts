import express from "express";
import {
  getAllUsers,
  verifySellerDocuments,
  updateUserStatus,
  getAdminUsers,
} from "../../controllers/admin/userManagement";
import { validateVerificationRequest } from "../../middlewares/validators";
import { validateStatusUpdate } from "../../middlewares/validators";
import { ADMIN_ONLY_ROLES } from "../../constant";
import { verifyToken, authorizeRoles } from "../../middlewares/authMiddleware"; 

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
 *       - in: query
 *         name: isSuspended
 *         schema:
 *           type: boolean
 *           example: true
 *         description: Filter users by suspension status (true or false)
 * 
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
 *               action:
 *                 type: string
 *                 enum: [activate, suspend]
 *                 description: Action to perform on the user account
 *               reason:
 *                 type: string
 *                 description: Reason for suspending or activating the user
 *     responses:
 *       200:
 *         description: User status updated successfully
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
 *                   example: "User account has been suspended successfully."
 *                 data:
 *                   type: object
 *                   description: Sanitized user object (password and pin omitted)
 *       400:
 *         description: Invalid request (e.g., user already suspended or not suspended, validation error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User is already suspended"
 *       401:
 *         description: Unauthorized - admin authentication required
 *       404:
 *         description: User not found
 * 
 * /api/admin/users/admin:
 *   get:
 *     summary: Get all admin users (Super Admin only)
 *     tags: [Admin Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Admin users fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Admin'
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Access denied
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


// Super Admin route to get all admin users
router.get("/admin", verifyToken, authorizeRoles("super_admin"), getAdminUsers);

export default router;
