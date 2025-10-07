import { Router } from 'express';
import { verifyToken } from '../../middlewares/authMiddleware';
import { getAnalyticsData, exportAnalyticsReport, exportMonthlyReport, getAdminDashboard, exportUserGrowthChart, getTransactionSummary } from '../../controllers/admin/analyticsController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin Analytics
 *   description: Analytics and reporting for admins
 */

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get analytics data for the admin dashboard
 *     description: Retrieves a comprehensive set of analytics data, including user statistics, revenue, sales performance, top products, and reports.
 *     tags: [Admin Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           default: 30
 *         description: The time period in days for which to retrieve analytics data (e.g., 7, 30, 90).
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         activeUsers:
 *                           type: integer
 *                         inactiveUsers:
 *                           type: integer
 *                         monthlyRevenue:
 *                           type: number
 *                         commission:
 *                           type: number
 *                     salesStatistics:
 *                       type: object
 *                       properties:
 *                         labels:
 *                           type: array
 *                           items:
 *                             type: string
 *                         revenue:
 *                           type: array
 *                           items:
 *                             type: number
 *                         expenses:
 *                           type: array
 *                           items:
 *                             type: number
 *                     topProducts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           percentage:
 *                             type: number
 *                     totalReport:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           reportName:
 *                             type: string
 *                           percentage:
 *                             type: number
 *                           lastUpdated:
 *                             type: string
 *                             format: date-time
 *                           fileFormat:
 *                             type: string
 *                           action:
 *                             type: string
 *       403:
 *         description: Access denied.
 *       500:
 *         description: Internal server error.
 */
router.get(
  '/',
  verifyToken,
  getAnalyticsData
);

/**
 * @swagger
 * /api/admin/analytics/dashboard:
 *   get:
 *     summary: Get data for the new admin dashboard
 *     description: Retrieves all data required for the new admin dashboard UI.
 *     tags: [Admin Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           default: 7
 *         description: The time period in days for which to retrieve analytics data (e.g., 7, 30, 90).
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully.
 *       403:
 *         description: Access denied.
 *       500:
 *         description: Internal server error.
 */
router.get(
    '/dashboard',
    verifyToken,
    getAdminDashboard
)

/**
 * @swagger
 * /api/admin/analytics/dashboard/export-user-growth:
 *   get:
 *     summary: Export the User Growth Chart as a PDF
 *     description: Generates and downloads a PDF of the user growth chart.
 *     tags: [Admin Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PDF report generated successfully.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Access denied.
 *       500:
 *         description: Internal server error.
 */
router.get(
    '/dashboard/export-user-growth',
    verifyToken,
    exportUserGrowthChart
)

/**
 * @swagger
 * /api/admin/analytics/export:
 *   get:
 *     summary: Export a detailed analytics report as a PDF
 *     description: Generates and downloads a detailed PDF report for the selected period, including a summary and a full list of transactions.
 *     tags: [Admin Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           default: 30
 *         description: The time period in days for which to generate the report (e.g., 7, 30, 90).
 *     responses:
 *       200:
 *         description: PDF report generated successfully.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Access denied.
 *       500:
 *         description: Internal server error.
 */
router.get(
  '/export',
  verifyToken,
  exportAnalyticsReport
);

/**
 * @swagger
 * /api/admin/analytics/report/monthly:
 *   get:
 *     summary: Export a detailed monthly transaction report as a PDF
 *     description: Generates and downloads a detailed PDF report for a specific month, including a summary and a full list of transactions.
 *     tags: [Admin Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           example: 2024
 *         required: true
 *         description: The year of the report.
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           example: 9
 *         required: true
 *         description: The month of the report (1-12).
 *     responses:
 *       200:
 *         description: PDF report generated successfully.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid input for year or month.
 *       403:
 *         description: Access denied.
 *       500:
 *         description: Internal server error.
 */
router.get(
    '/report/monthly',
    verifyToken,
    exportMonthlyReport
)

/**
 * @swagger
 * /api/admin/analytics/transaction-summary:
 *   get:
 *     summary: Get transaction summary for dashboard cards
 *     description: Retrieves key transaction metrics for display on the admin dashboard.
 *     tags: [Admin Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transaction summary retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: number
 *                     totalTransactions:
 *                       type: number
 *                     completed:
 *                       type: number
 *                     failed:
 *                       type: number
 *                     sellersPendingBalance:
 *                       type: number
 *                     sellersBalance:
 *                       type: number
 *                     commissionEarnings:
 *                       type: number
 *                     totalRefunds:
 *                       type: number
 *       403:
 *         description: Access denied.
 *       500:
 *         description: Internal server error.
 */
router.get(
    '/transaction-summary',
    verifyToken,
    getTransactionSummary
)

export default router;
