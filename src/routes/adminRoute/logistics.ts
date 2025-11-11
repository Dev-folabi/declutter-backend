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
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           logisticId:
 *                             type: string
 *                           orderId:
 *                             type: string
 *                           status:
 *                             type: string
 *                           date:
 *                             type: string
 *                           time:
 *                             type: string
 *       403:
 *         description: Unauthorized access
 */

/**
 * @swagger
 * /api/admin/logistics/{logisticId}/status:
 *   patch:
 *     summary: Update a logistic status
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
 *         description: Invalid action or missing logistic ID
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
 *                   type: object
 *                   properties:
 *                     invoiceId:
 *                       type: string
 *                     linkedOrder:
 *                       type: string
 *                     status:
 *                       type: string
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
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           invoiceId:
 *                             type: string
 *                           createdBy:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                           status:
 *                             type: string
 *                           typeOfAssignment:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       403:
 *         description: Unauthorized access
 */

/**
 * @swagger
 * /api/admin/logistics/{id}/invoice-status:
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
 * /api/admin/logistics/stats:
 *   get:
 *     summary: Get logistics statistics (cards)
 *     tags: [Logistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logistics statistics retrieved successfully
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
 *                   type: object
 *                   properties:
 *                     totalAvailableItems:
 *                       type: integer
 *                     failedDeliveries:
 *                       type: integer
 *                     successfulPickups:
 *                       type: integer
 *                     failedPickups:
 *                       type: integer
 *                     successfulDeliveries:
 *                       type: integer
 *       403:
 *         description: Unauthorized access
 */

/**
 * @swagger
 * /api/admin/logistics/invoices/{id}/download:
 *   get:
 *     summary: Download a successful delivery invoice as PDF
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
 *         description: Invalid request (invoice not successful or not delivery)
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Invoice not found
 */
router.get(
  "/invoices/:id/download",
  authorizeRoles(...LOGISTIC_ONLY_ROLES),
  downloadInvoicePdf
);
router.get("/stats", authorizeRoles(...LOGISTIC_ONLY_ROLES), getLogisticsStats);
router.get("/", authorizeRoles(...LOGISTIC_ONLY_ROLES), getAllLogistics);
router.patch(
  "/:logisticId/status",
  validateLogisticStatusUpdate,
  authorizeRoles(...LOGISTIC_ONLY_ROLES),
  setlogisticStatus
);
router.post(
  "/create-invoice",
  validateCreateInvoice,
  authorizeRoles(...LOGISTIC_ONLY_ROLES),
  createInvoice
);
router.get("/invoices", authorizeRoles(...LOGISTIC_ONLY_ROLES), getAllInvoices);
router.patch(
  "/:id/invoice-status",
  validateSetInvoiceStatus,
  authorizeRoles(...LOGISTIC_ONLY_ROLES),
  setInvoiceStatus
);

export default router;
