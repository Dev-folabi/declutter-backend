import { Request, Response, NextFunction } from 'express';
import { User } from '../../models/userModel';
import { Order } from '../../models/order';
import { Product } from '../../models/productList';
import mongoose from 'mongoose';

export const getAnalyticsData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = parseInt(req.query.period as string, 10) || 30;
    const now = new Date();
    const startDate = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);

    // 1. Summary Cards Data
    const activeUsers = await User.countDocuments({ emailVerified: true });
    const inactiveUsers = await User.countDocuments({ emailVerified: false });

    const revenueData = await Order.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: startDate } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
    const commission = totalRevenue * 0.10; // Assuming 10% commission

    // 2. Sales Statistics (Last 12 Months)
    const salesStatistics = await Order.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          totalRevenue: { $sum: '$totalPrice' },
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

    // Assuming no expenses data for now
    const monthlyExpenses = Array(12).fill(0);

    // 3. Top Products
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

    // 4. Total Report
    const totalReport = orderedMonthLabels.map((month, index) => ({
        reportName: `${month} Revenue Report`,
        percentage: ((monthlyRevenue[index] / totalRevenue) * 100) || 0,
        lastUpdated: new Date(),
        fileFormat: 'CSV',
        action: 'Download'
    }));


    res.status(200).json({
      success: true,
      data: {
        summary: {
          activeUsers,
          inactiveUsers,
          monthlyRevenue: totalRevenue,
          commission,
        },
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

export const exportAnalyticsReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = parseInt(req.query.period as string, 10) || 30;
    const now = new Date();
    const startDate = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);

    const revenueData = await Order.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: startDate } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    const salesStatistics = await Order.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          totalRevenue: { $sum: '$totalPrice' },
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

    const totalReportData = orderedMonthLabels.map((month, index) => ({
        reportName: `${month} Revenue Report`,
        percentage: ((monthlyRevenue[index] / totalRevenue) * 100) || 0,
        lastUpdated: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
        fileFormat: 'CSV',
    }));

    // Convert to CSV
    const csvHeader = "Report Name,Percentage,Last Updated,File Format\n";
    const csvBody = totalReportData.map(row =>
        `"${row.reportName}",${row.percentage.toFixed(2)}%,"${row.lastUpdated}","${row.fileFormat}"`
    ).join('\n');

    const csv = csvHeader + csvBody;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.csv"');
    res.status(200).send(csv);

  } catch (error) {
    next(error);
  }
};
