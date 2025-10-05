import express from "express";
import {
  getAllUsers,
  verifySellerDocuments,
  updateUserStatus,
  getAdminUsers,
  getUserById,
  getAdminById,
} from "../../controllers/admin/userManagement";
import { validateVerificationRequest } from "../../middlewares/validators";
import { validateStatusUpdate } from "../../middlewares/validators";
import { ADMIN_ONLY_ROLES } from "../../constant";
import { verifyToken, authorizeRoles } from "../../middlewares/authMiddleware";

const router = express.Router();
/**
 * @swagger
 * tags:
 *   - name: User Management
 *     description: Endpoints for managing users
 *   - name: Admin Authentication
 *     description: Endpoints for managing admin accounts
 *
 * paths:
 *   /api/admin/users:
 *     get:
 *       tags: [User Management]
 *       summary: Get all users
 *       description: Admin can fetch a paginated list of users with optional filters like status, verification status, role, and search.
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - name: page
 *           in: query
 *           schema:
 *             type: integer
 *             example: 1
 *           required: false
 *           description: Page number
 *         - name: limit
 *           in: query
 *           schema:
 *             type: integer
 *             example: 10
 *           required: false
 *           description: Number of users per page
 *         - name: status
 *           in: query
 *           schema:
 *             type: string
 *             enum: [active, inactive, suspended]
 *           required: false
 *           description: Filter by account status
 *         - name: sellerStatus
 *           in: query
 *           schema:
 *             type: string
 *             enum: [pending, approved, rejected, "not enroll"]
 *           required: false
 *           description: Filter by seller status
 *         - name: roles
 *           in: query
 *           schema:
 *             type: string
 *           required: false
 *           description: Filter by role (comma-separated for multiple values)
 *         - name: search
 *           in: query
 *           schema:
 *             type: string
 *           required: false
 *           description: Search by name or email
 *         - in: query
 *           name: isSuspended
 *           schema:
 *             type: boolean
 *             example: true
 *           description: Filter users by suspension status (true or false)
 *       responses:
 *         '200':
 *           description: Users fetched successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   message:
 *                     type: string
 *                     example: "Users fetched successfully"
 *                   data:
 *                     type: array
 *                     items:
 *                       type: object
 *         '400':
 *           description: Bad request
 *         '401':
 *           description: Unauthorized
 *
 *   /api/admin/users/{userId}/verify-seller:
 *     patch:
 *       tags: [User Management]
 *       summary: Verify or reject seller documents
 *       description: Admin verifies or rejects a seller's application and sends an email notification.
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - name: userId
 *           in: path
 *           required: true
 *           schema:
 *             type: string
 *           description: ID of the user to verify
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - status
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [approved, rejected]
 *                   example: approved
 *                 reason:
 *                   type: string
 *                   description: Reason for rejection (required if status is rejected)
 *                   example: "Documents incomplete"
 *                 comment:
 *                   type: string
 *                   description: Optional admin comment
 *                   example: "All documents verified."
 *       responses:
 *         '200':
 *           description: Seller verification updated
 *         '400':
 *           description: Validation error
 *         '404':
 *           description: User not found
 *         '401':
 *           description: Unauthorized
 *
 *   /api/admin/users/{userId}/status:
 *     patch:
 *       tags: [User Management]
 *       summary: Activate or suspend user account
 *       description: Admin can change a user's account status.
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - name: userId
 *           in: path
 *           required: true
 *           schema:
 *             type: string
 *           description: ID of the user
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - action
 *               properties:
 *                 action:
 *                   type: string
 *                   enum: [activate, suspend]
 *                   description: Action to perform on the user account
 *                   example: suspend
 *                 reason:
 *                   type: string
 *                   description: Reason for suspending or activating the user
 *                   example: "Violation of policies"
 *       responses:
 *         '200':
 *           description: User status updated successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   message:
 *                     type: string
 *                     example: "User account has been suspended successfully."
 *                   data:
 *                     type: object
 *                     description: Sanitized user object (password and pin omitted)
 *         '400':
 *           description: Invalid request (validation error, already suspended, etc.)
 *         '401':
 *           description: Unauthorized
 *         '404':
 *           description: User not found
 *
 *   /api/admin/users/admin:
 *     get:
 *       summary: Get all admin users with role-based filtering
 *       description: >
 *         Retrieves a list of admin users.
 *         - A `super_admin` will receive a list of all admin users.
 *         - A regular `admin` will receive a list of all admin users except for other `super_admin`s.
 *       tags: [Admin Authentication]
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         '200':
 *           description: Admin users fetched successfully.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   message:
 *                     type: string
 *                     example: "Admin users fetched successfully"
 *                   data:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Admin'
 *         '401':
 *           description: Unauthorized
 *         '403':
 *           description: Access denied
 *   /api/admin/users/{userId}:
 *     get:
 *       tags: [User Management]
 *       summary: Get a single user by ID
 *       description: Admin can fetch a single user's details by their ID.
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - name: userId
 *           in: path
 *           required: true
 *           schema:
 *             type: string
 *           description: ID of the user to retrieve
 *       responses:
 *         '200':
 *           description: User fetched successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   message:
 *                     type: string
 *                     example: "User fetched successfully"
 *                   data:
 *                     type: object
 *         '404':
 *           description: User not found
 *         '401':
 *           description: Unauthorized
 *   /api/admin/users/admin/{adminId}:
 *     get:
 *       summary: Get a single admin user by ID with role-based filtering
 *       description: >
 *         Retrieves a single admin user by their ID.
 *         - A `super_admin` can retrieve any admin user's profile.
 *         - A regular `admin` can retrieve any admin user's profile except for a `super_admin`'s.
 *       tags: [Admin Authentication]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - name: adminId
 *           in: path
 *           required: true
 *           schema:
 *             type: string
 *           description: ID of the admin to retrieve
 *       responses:
 *         '200':
 *           description: Admin user fetched successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   message:
 *                     type: string
 *                     example: "Admin user fetched successfully"
 *                   data:
 *                     $ref: '#/components/schemas/Admin'
 *         '401':
 *           description: Unauthorized
 *         '403':
 *           description: Access denied
 *         '404':
 *           description: Admin not found
 */

router.get("/", authorizeRoles(...ADMIN_ONLY_ROLES), getAllUsers);
router.get("/:userId", authorizeRoles(...ADMIN_ONLY_ROLES), getUserById);
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
router.get("/admin", authorizeRoles(...ADMIN_ONLY_ROLES), getAdminUsers);
router.get("/admin/:adminId", authorizeRoles(...ADMIN_ONLY_ROLES), getAdminById);

export default router;
