import { Router } from 'express';
import { verifyToken } from '../../middlewares/authMiddleware';
import { getAnalyticsData, exportAnalyticsReport } from '../../controllers/admin/analyticsController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin Analytics
 *   description: Analytics and reporting for admins
 */

/**
 * @swagger
 * /admin/analytics:
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
 * /admin/analytics/export:
 *   get:
 *     summary: Export analytics report as a CSV file
 *     description: Generates and downloads a CSV file containing the total analytics report.
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
 *         description: CSV report generated successfully.
 *         content:
 *           text/csv:
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

export default router;
