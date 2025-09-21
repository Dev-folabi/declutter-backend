import { Request, Response, NextFunction } from 'express';
import { User } from '../../models/userModel';
import { Order } from '../../models/order';
import { Product } from '../../models/productList';
import { Transaction } from '../../models/transactionModel';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';

const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
};

// Private helper function to get summary data
const _getAnalyticsSummary = async (period: number) => {
    const now = new Date();
    const startDate = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);
    const previousStartDate = new Date(now.getTime() - 2 * period * 24 * 60 * 60 * 1000);

    const currentUserMetrics = await User.aggregate([
        { $match: { emailVerified: true } },
        { $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: { $sum: { $cond: [{ $gte: ['$lastLogin', startDate] }, 1, 0] } }
        }}
    ]);

    const previousActiveUsers = await User.countDocuments({
      emailVerified: true,
      lastLogin: { $gte: previousStartDate, $lt: startDate },
    });

    const activeUsers = currentUserMetrics.length > 0 ? currentUserMetrics[0].activeUsers : 0;
    const totalUsers = currentUserMetrics.length > 0 ? currentUserMetrics[0].totalUsers : 0;
    const inactiveUsers = totalUsers - activeUsers;

    const activeUsersPercentageChange = calculatePercentageChange(activeUsers, previousActiveUsers);

    const previousTotalUsers = await User.countDocuments({ emailVerified: true, createdAt: { $lt: startDate } });
    const previousInactiveUsers = previousTotalUsers - previousActiveUsers;
    const inactiveUsersPercentageChange = calculatePercentageChange(inactiveUsers, previousInactiveUsers);

    const financialData = await Transaction.aggregate([
        { $match: { status: 'completed', transactionDate: { $gte: previousStartDate } } },
        {
          $group: {
            _id: null,
            currentRevenue: { $sum: { $cond: [{ $gte: ['$transactionDate', startDate] }, '$revenue', 0] } },
            previousRevenue: { $sum: { $cond: [{ $lt: ['$transactionDate', startDate] }, '$revenue', 0] } },
            currentSellerEarnings: { $sum: { $cond: [{ $gte: ['$transactionDate', startDate] }, '$sellerEarnings', 0] } },
            previousSellerEarnings: { $sum: { $cond: [{ $lt: ['$transactionDate', startDate] }, '$sellerEarnings', 0] } },
          },
        },
      ]);

      const currentRevenue = financialData.length > 0 ? financialData[0].currentRevenue : 0;
      const previousRevenue = financialData.length > 0 ? financialData[0].previousRevenue : 0;
      const currentCommission = currentRevenue - (financialData.length > 0 ? financialData[0].currentSellerEarnings : 0);
      const previousCommission = previousRevenue - (financialData.length > 0 ? financialData[0].previousSellerEarnings : 0);

      const revenuePercentageChange = calculatePercentageChange(currentRevenue, previousRevenue);
      const commissionPercentageChange = calculatePercentageChange(currentCommission, previousCommission);

      return {
        activeUsers: { value: activeUsers, percentageChange: activeUsersPercentageChange },
        inactiveUsers: { value: inactiveUsers, percentageChange: inactiveUsersPercentageChange },
        monthlyRevenue: { value: currentRevenue, percentageChange: revenuePercentageChange },
        commission: { value: currentCommission, percentageChange: commissionPercentageChange },
      };
}

export const getAnalyticsData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = parseInt(req.query.period as string, 10) || 30;
    const startDate = new Date(new Date().getTime() - period * 24 * 60 * 60 * 1000);

    // --- Get Summary Data ---
    const summary = await _getAnalyticsSummary(period);

    // --- Sales Statistics (Last 12 Months) ---
    const salesStatistics = await Transaction.aggregate([
        {
          $match: {
            status: 'completed',
            transactionDate: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$transactionDate' },
              month: { $month: '$transactionDate' },
            },
            totalRevenue: { $sum: '$revenue' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      const monthlyRevenue = Array(12).fill(0);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      const orderedMonthLabels = [...monthNames.slice(currentMonth + 1), ...monthNames.slice(0, currentMonth + 1)];

      salesStatistics.forEach(item => {
          const monthIndex = item._id.month -1;
          const indexInOrdered = orderedMonthLabels.indexOf(monthNames[monthIndex]);
          if(indexInOrdered !== -1) {
              monthlyRevenue[indexInOrdered] = item.totalRevenue;
          }
      });

      const monthlyExpenses = Array(12).fill(0);

    // --- Top Products (still requires Order model) ---
    const topProductsData = await Order.aggregate([
        { $match: { status: 'paid', createdAt: { $gte: startDate } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            totalSold: { $sum: '$items.price' },
          },
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productDetails',
          },
        },
        { $unwind: '$productDetails' },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
        {
          $project: {
            name: '$productDetails.name',
            totalSold: '$totalSold',
          },
        },
      ]);

      const totalSalesForPeriod = await Order.aggregate([
          { $match: { status: 'paid', createdAt: { $gte: startDate } } },
          { $unwind: '$items' },
          { $group: { _id: null, total: { $sum: '$items.price' } } }
      ]);
      const totalSales = totalSalesForPeriod.length > 0 ? totalSalesForPeriod[0].total : 1;

      const topProducts = topProductsData.map(p => ({
        name: p.name,
        percentage: (p.totalSold / totalSales) * 100,
      }));

    // --- Total Report ---
    const totalReport = orderedMonthLabels.map((month, index) => ({
        reportName: `${month} Revenue Report`,
        percentage: ((monthlyRevenue[index] / summary.monthlyRevenue.value) * 100) || 0,
        lastUpdated: new Date(),
        fileFormat: 'PDF',
        action: 'Download'
    }));

    res.status(200).json({
      success: true,
      data: {
        summary,
        salesStatistics: {
          labels: orderedMonthLabels,
          revenue: monthlyRevenue,
          expenses: monthlyExpenses,
        },
        topProducts,
        totalReport,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportMonthlyReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const year = parseInt(req.query.year as string);
        const month = parseInt(req.query.month as string);

        if (!year || !month || month < 1 || month > 12) {
            return res.status(400).json({ success: false, message: 'Invalid year or month provided.' });
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const transactions = await Transaction.find({
            status: 'completed',
            transactionDate: { $gte: startDate, $lte: endDate }
        }).populate('userId', 'fullName');

        const summary = await Transaction.aggregate([
            { $match: { status: 'completed', transactionDate: { $gte: startDate, $lte: endDate } } },
            { $group: {
                _id: null,
                totalRevenue: { $sum: '$revenue' },
                totalCommission: { $sum: { $subtract: ['$revenue', '$sellerEarnings'] } },
                totalTransactions: { $sum: 1 }
            }}
        ]);

        const reportSummary = summary[0] || { totalRevenue: 0, totalCommission: 0, totalTransactions: 0 };

        const doc = new PDFDocument({ margin: 50 });
        const reportName = `Monthly_Report_${year}_${month}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${reportName}"`);
        doc.pipe(res);

        // --- PDF Content ---
        doc.fontSize(20).text(`Transaction Report - ${startDate.toLocaleString('default', { month: 'long' })} ${year}`, { align: 'center' });
        doc.moveDown(2);

        // Summary Section
        doc.fontSize(16).text('Report Summary', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Total Revenue: $${reportSummary.totalRevenue.toFixed(2)}`);
        doc.text(`Total Commission: $${reportSummary.totalCommission.toFixed(2)}`);
        doc.text(`Total Transactions: ${reportSummary.totalTransactions}`);
        doc.moveDown(2);

        // Table Header
        doc.fontSize(14).text('Detailed Transactions', { underline: true });
        doc.moveDown();
        const tableTop = doc.y;
        const itemX = 50;
        const dateX = 150;
        const typeX = 250;
        const amountX = 350;
        const statusX = 450;

        doc.fontSize(10)
            .text('User', itemX, tableTop)
            .text('Date', dateX, tableTop)
            .text('Description', typeX, tableTop)
            .text('Amount', amountX, tableTop, { width: 100, align: 'right' })
            .text('Status', statusX, tableTop);

        doc.moveTo(itemX - 10, doc.y).lineTo(statusX + 100, doc.y).stroke();
        doc.moveDown();

        // Table Rows
        transactions.forEach(tx => {
            const user = tx.userId as any;
            const y = doc.y;
            doc.fontSize(10)
                .text(user?.fullName || 'N/A', itemX, y, { width: 90, ellipsis: true })
                .text(tx.transactionDate.toLocaleDateString(), dateX, y)
                .text(tx.description || '', typeX, y, { width: 90, ellipsis: true })
                .text(`$${tx.amount.toFixed(2)}`, amountX, y, { width: 100, align: 'right' })
                .text(tx.status, statusX, y);
            doc.moveDown();
        });

        doc.end();

    } catch (error) {
        next(error);
    }
};

export const exportAnalyticsReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const period = parseInt(req.query.period as string, 10) || 30;
        const now = new Date();
        const startDate = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);

        // Fetch summary data
        const summary = await _getAnalyticsSummary(period);

        // Fetch transactions for the period
        const transactions = await Transaction.find({
            status: 'completed',
            transactionDate: { $gte: startDate }
        }).populate('userId', 'fullName').sort({ transactionDate: -1 });

        const doc = new PDFDocument({ margin: 50 });
        const reportName = `Analytics_Report_Last_${period}_Days.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${reportName}"`);
        doc.pipe(res);

        // --- PDF Content ---
        doc.fontSize(20).text(`Analytics Report - Last ${period} Days`, { align: 'center' });
        doc.moveDown(2);

        // Summary Section
        doc.fontSize(16).text('Period Summary', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Active Users: ${summary.activeUsers.value} (${summary.activeUsers.percentageChange.toFixed(2)}%)`);
        doc.text(`Revenue: $${summary.monthlyRevenue.value.toFixed(2)} (${summary.monthlyRevenue.percentageChange.toFixed(2)}%)`);
        doc.text(`Commission: $${summary.commission.value.toFixed(2)} (${summary.commission.percentageChange.toFixed(2)}%)`);
        doc.moveDown(2);

        // Table Header
        doc.fontSize(14).text('Detailed Transactions', { underline: true });
        doc.moveDown();
        const tableTop = doc.y;
        const itemX = 50;
        const dateX = 150;
        const typeX = 250;
        const amountX = 350;
        const statusX = 450;

        doc.fontSize(10)
            .text('User', itemX, tableTop)
            .text('Date', dateX, tableTop)
            .text('Description', typeX, tableTop)
            .text('Amount', amountX, tableTop, { width: 100, align: 'right' })
            .text('Status', statusX, tableTop);

        doc.moveTo(itemX - 10, doc.y).lineTo(statusX + 100, doc.y).stroke();
        doc.moveDown();

        // Table Rows
        transactions.forEach(tx => {
            const user = tx.userId as any;
            const y = doc.y;
            doc.fontSize(10)
                .text(user?.fullName || 'N/A', itemX, y, { width: 90, ellipsis: true })
                .text(tx.transactionDate.toLocaleDateString(), dateX, y)
                .text(tx.description || '', typeX, y, { width: 90, ellipsis: true })
                .text(`$${tx.amount.toFixed(2)}`, amountX, y, { width: 100, align: 'right' })
                .text(tx.status, statusX, y);
            doc.moveDown();
        });

        doc.end();

    } catch (error) {
        next(error);
    }
};
