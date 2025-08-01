import express from 'express';
import {
  getAllUsers,
  verifyUserDocuments,
  updateUserStatus,
} from '../../controllers/admin/userManagement';
import {validateVerificationRequest} from '../../middlewares/validators'
import {validateStatusUpdate} from '../../middlewares/validators'
import { protectAdmin } from '../../middlewares/authMiddleware';

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
 *       - name: verification
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected]
 *         required: false
 *         description: Filter by verification status
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
 * /api/admin/users/verify-docs/{userId}:
 *   post:
 *     tags: [User Management]
 *     summary: Verify or reject user documents
 *     description: Admin verifies or rejects a user's uploaded documents and sends an email notification.
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
 *                 enum: [verified, rejected]
 *               comment:
 *                 type: string
 *                 description: Optional admin comment or reason for rejection
 *     responses:
 *       200:
 *         description: User verification updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *
 * /api/admin/users/status/{userId}:
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

router.get('/', protectAdmin, getAllUsers);
router.patch('/:userId/verify-docs', protectAdmin, validateVerificationRequest,  verifyUserDocuments);
router.patch('/:userId/status', protectAdmin, validateStatusUpdate, updateUserStatus);

export default router;
