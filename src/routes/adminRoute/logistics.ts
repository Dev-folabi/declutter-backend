import {
  getAllLogistics,
  setlogisticStatus,
  createInvoice,
  getAllInvoices,
  setInvoiceStatus,
  getLogisticsStats,
  downloadInvoicePdf,
} from "../../controllers/admin/logistics";
import {
  validateCreateInvoice,
  validateSetInvoiceStatus,
  validateLogisticStatusUpdate,
} from "../../middlewares/validators";

import { LOGISTIC_ONLY_ROLES } from "../../constant";
import express from "express";
import { authorizeRoles } from "../../middlewares/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Logistics
 *   description: Logistics and Invoice Management APIs
 */

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: Invoice Management APIs
 */

/**
 * @swagger
 * /api/admin/logistics:
 *   get:
 *     summary: Get all logistics
 *     tags: [Logistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         description: Filter by logistics status
 *         schema:
 *           type: string
 *           enum: [ready_for_pickup, in_transit, delivered]
 *       - name: startDate
 *         in: query
 *         description: Filter logistics created after this date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         description: Filter logistics created before this date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - name: orderId
 *         in: query
 *         description: Filter by order ID
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         description: Page number for pagination
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: Number of records per page
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Logistics retrieved successfully
 *       403:
 *         description: Unauthorized access
 */

/**
 * @swagger
 * /api/admin/logistics/stats:
 *   get:
 *     summary: Get logistics statistics
 *     tags: [Logistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logistics statistics retrieved successfully
 *       403:
 *         description: Unauthorized access
 */

/**
 * @swagger
 * /api/admin/logistics/create-invoice:
 *   post:
 *     summary: Create a new invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderCustomId
 *               - amount
 *               - typeOfAssignment
 *             properties:
 *               orderCustomId:
 *                 type: string
 *               amount:
 *                 type: number
 *               pickupAddress:
 *                 type: string
 *               deliveryAddress:
 *                 type: string
 *               typeOfAssignment:
 *                 type: string
 *                 enum: [pickup, delivery, pickup_and_delivery]
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Unauthorized access
 */

/**
 * @swagger
 * /api/admin/logistics/invoices:
 *   get:
 *     summary: Get all invoices
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         description: Filter invoices by status
 *         schema:
 *           type: string
 *       - name: agent
 *         in: query
 *         description: Filter invoices by agent ID
 *         schema:
 *           type: string
 *       - name: startDate
 *         in: query
 *         description: Start date for filtering (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         description: End date for filtering (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *       - name: search
 *         in: query
 *         description: Search invoices by pickup or delivery address
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         description: Page number
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: Number of records per page
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Invoices retrieved successfully
 *       403:
 *         description: Unauthorized access
 */

/**
 * @swagger
 * /api/admin/logistics/invoices/{id}/download:
 *   get:
 *     summary: Download invoice as PDF
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Invoice ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF file stream
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Invoice not found
 */

/**
 * @swagger
 * /api/admin/logistics/invoices/{id}/invoice-status:
 *   patch:
 *     summary: Update invoice status
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Invoice ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: paid
 *     responses:
 *       200:
 *         description: Invoice status updated successfully
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Invoice not found
 */

/**
 * @swagger
 * /api/admin/logistics/{logisticId}/status:
 *   patch:
 *     summary: Update logistic status
 *     tags: [Logistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: logisticId
 *         in: path
 *         required: true
 *         description: ID of the logistic record
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [picked_up, delivered, to_be_picked_up]
 *     responses:
 *       200:
 *         description: Logistic status updated successfully
 *       400:
 *         description: Invalid action
 *       403:
 *         description: Unauthorized access
 */

// ============ ROUTES ============

// Stats route
router.get("/stats", authorizeRoles(...LOGISTIC_ONLY_ROLES), getLogisticsStats);

// Invoice routes - all specific paths with "invoices" prefix
router.post(
  "/create-invoice",
  validateCreateInvoice,
  authorizeRoles(...LOGISTIC_ONLY_ROLES),
  createInvoice
);

router.get("/invoices", authorizeRoles(...LOGISTIC_ONLY_ROLES), getAllInvoices);

router.get(
  "/invoices/:id/download",
  authorizeRoles(...LOGISTIC_ONLY_ROLES),
  downloadInvoicePdf
);

router.patch(
  "/invoices/:id/invoice-status",
  validateSetInvoiceStatus,
  authorizeRoles(...LOGISTIC_ONLY_ROLES),
  setInvoiceStatus
);

// Base logistics routes
router.get("/", authorizeRoles(...LOGISTIC_ONLY_ROLES), getAllLogistics);

router.patch(
  "/:logisticId/status",
  validateLogisticStatusUpdate,
  authorizeRoles(...LOGISTIC_ONLY_ROLES),
  setlogisticStatus
);

export default router;
