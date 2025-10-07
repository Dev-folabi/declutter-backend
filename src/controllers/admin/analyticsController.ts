import { Request, Response, NextFunction } from "express";
import { User } from "../../models/userModel";
import { Order } from "../../models/order";
import { Product } from "../../models/productList";
import { Transaction } from "../../models/transactionModel";
import PDFDocument from "pdfkit";
import { handleError } from "../../error/errorHandler";

export const getTransactionStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const [
      balance,
      totalTransactions,
      completedTransactions,
      failedTransactions,
      sellersPendingBalance,
      sellersBalance,
      commissionEarnings,
      totalRefunds,
    ] = await Promise.all([
      // Balance: Total completed credit transactions
      Transaction.aggregate([
        { $match: { status: "completed", transactionType: "credit" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      // Total Transaction: Sum of amounts all transactions
      Transaction.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      // Completed: Sum of amounts all complete transactions
      Transaction.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      // Failed: Sum of amounts all failed transactions
      Transaction.aggregate([
        { $match: { status: "failed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      // Sellers Pending Balance: The sum of the pendingBalance from all seller accounts
      User.aggregate([
        { $match: { role: "seller", "accountDetail.pendingBalance": { $exists: true } } },
        { $group: { _id: null, total: { $sum: "$accountDetail.pendingBalance" } } },
      ]),
      // Sellers Balance: The sum of the availableBalance for all sellers
      User.aggregate([
        { $match: { role: "seller", "accountDetail.availableBalance": { $exists: true } } },
        { $group: { _id: null, total: { $sum: "$accountDetail.availableBalance" } } },
      ]),
      // Commission Earnings: The sum of the revenue generated from complete credit transactions
      Transaction.aggregate([
        { $match: { status: "completed", transactionType: "credit" } },
        { $group: { _id: null, total: { $sum: "$revenue" } } },
      ]),
      // Total Refunds: the total sum amounts of 'refunded' transactions
      Transaction.aggregate([
        { $match: { status: "refunded" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const extractTotal = (result: any[]) => result.length > 0 ? result[0].total : 0;

    res.status(200).json({
      success: true,
      data: {
        balance: extractTotal(balance),
        totalTransactions: extractTotal(totalTransactions),
        completed: extractTotal(completedTransactions),
        failed: extractTotal(failedTransactions),
        sellersPendingBalance: extractTotal(sellersPendingBalance),
        sellersBalance: extractTotal(sellersBalance),
        commissionEarnings: extractTotal(commissionEarnings),
        totalRefunds: extractTotal(totalRefunds),
      },
    });
  } catch (error) {
    next(error);
  }
};

const calculatePercentageChange = (
  current: number,
  previous: number
): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
};

const _getUserGrowthChartData = async () => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        month: d.toLocaleString("default", { month: "short" }),
        year: d.getFullYear(),
        startDate: new Date(d.getFullYear(), d.getMonth(), 1),
        endDate: new Date(d.getFullYear(), d.getMonth() + 1, 0),
      };
    }).reverse();

    const newUsersData = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const returningUsersData = await User.aggregate([
        {
            $group: {
                _id: {
                    year: { $year: "$lastLogin" },
                    month: { $month: "$lastLogin" },
                },
                count: { $sum: 1 },
            },
        },
    ]);

    return months.map((m) => {
      const newUsers = newUsersData.find(
        (d) => d._id.year === m.year && d._id.month === m.startDate.getMonth() + 1
      );
      const returningUsers = returningUsersData.find(
        (d) => d._id.year === m.year && d._id.month === m.startDate.getMonth() + 1
      );
      return {
        month: m.month,
        newUsers: newUsers ? newUsers.count : 0,
        returningUsers: returningUsers ? returningUsers.count : 0,
      };
    });
}

// Private helper function to get summary data
const _getAnalyticsSummary = async (period: number) => {
  const now = new Date();
  const startDate = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);
  const previousStartDate = new Date(
    now.getTime() - 2 * period * 24 * 60 * 60 * 1000
  );

  const currentUserMetrics = await User.aggregate([
    { $match: { emailVerified: true } },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: [{ $gte: ["$lastLogin", startDate] }, 1, 0] },
        },
      },
    },
  ]);

  const previousActiveUsers = await User.countDocuments({
    emailVerified: true,
    lastLogin: { $gte: previousStartDate, $lt: startDate },
  });

  const activeUsers =
    currentUserMetrics.length > 0 ? currentUserMetrics[0].activeUsers : 0;
  const totalUsers =
    currentUserMetrics.length > 0 ? currentUserMetrics[0].totalUsers : 0;
  const inactiveUsers = totalUsers - activeUsers;

  const activeUsersPercentageChange = calculatePercentageChange(
    activeUsers,
    previousActiveUsers
  );

  const previousTotalUsers = await User.countDocuments({
    emailVerified: true,
    createdAt: { $lt: startDate },
  });
  const previousInactiveUsers = previousTotalUsers - previousActiveUsers;
  const inactiveUsersPercentageChange = calculatePercentageChange(
    inactiveUsers,
    previousInactiveUsers
  );

  const financialData = await Transaction.aggregate([
    {
      $match: {
        status: "completed",
        transactionDate: { $gte: previousStartDate },
      },
    },
    {
      $group: {
        _id: null,
        currentRevenue: {
          $sum: {
            $cond: [{ $gte: ["$transactionDate", startDate] }, "$revenue", 0],
          },
        },
        previousRevenue: {
          $sum: {
            $cond: [{ $lt: ["$transactionDate", startDate] }, "$revenue", 0],
          },
        },
        currentSellerEarnings: {
          $sum: {
            $cond: [
              { $gte: ["$transactionDate", startDate] },
              "$sellerEarnings",
              0,
            ],
          },
        },
        previousSellerEarnings: {
          $sum: {
            $cond: [
              { $lt: ["$transactionDate", startDate] },
              "$sellerEarnings",
              0,
            ],
          },
        },
      },
    },
  ]);

  const currentRevenue =
    financialData.length > 0 ? financialData[0].currentRevenue : 0;
  const previousRevenue =
    financialData.length > 0 ? financialData[0].previousRevenue : 0;
  const currentCommission =
    currentRevenue -
    (financialData.length > 0 ? financialData[0].currentSellerEarnings : 0);
  const previousCommission =
    previousRevenue -
    (financialData.length > 0 ? financialData[0].previousSellerEarnings : 0);

  const revenuePercentageChange = calculatePercentageChange(
    currentRevenue,
    previousRevenue
  );
  const commissionPercentageChange = calculatePercentageChange(
    currentCommission,
    previousCommission
  );

  return {
    activeUsers: {
      value: activeUsers,
      percentageChange: activeUsersPercentageChange,
    },
    inactiveUsers: {
      value: inactiveUsers,
      percentageChange: inactiveUsersPercentageChange,
    },
    monthlyRevenue: {
      value: currentRevenue,
      percentageChange: revenuePercentageChange,
    },
    commission: {
      value: currentCommission,
      percentageChange: commissionPercentageChange,
    },
  };
};

export const getAnalyticsData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const period = parseInt(req.query.period as string, 10) || 30;
    const startDate = new Date(
      new Date().getTime() - period * 24 * 60 * 60 * 1000
    );

    // --- Get Summary Data ---
    const summary = await _getAnalyticsSummary(period);

    // --- Sales Statistics (Last 12 Months) ---
    const salesStatistics = await Transaction.aggregate([
      {
        $match: {
          status: "completed",
          transactionDate: {
            $gte: new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            ),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$transactionDate" },
            month: { $month: "$transactionDate" },
          },
          totalRevenue: { $sum: "$revenue" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthlyRevenue = Array(12).fill(0);
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentMonth = new Date().getMonth();
    const orderedMonthLabels = [
      ...monthNames.slice(currentMonth + 1),
      ...monthNames.slice(0, currentMonth + 1),
    ];

    salesStatistics.forEach((item) => {
      const monthIndex = item._id.month - 1;
      const indexInOrdered = orderedMonthLabels.indexOf(monthNames[monthIndex]);
      if (indexInOrdered !== -1) {
        monthlyRevenue[indexInOrdered] = item.totalRevenue;
      }
    });

    const monthlyExpenses = Array(12).fill(0);

    // --- Top Products (still requires Order model) ---
    const topProductsData = await Order.aggregate([
      { $match: { status: "paid", createdAt: { $gte: startDate } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.price" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $project: {
          name: "$productDetails.name",
          totalSold: "$totalSold",
        },
      },
    ]);

    const totalSalesForPeriod = await Order.aggregate([
      { $match: { status: "paid", createdAt: { $gte: startDate } } },
      { $unwind: "$items" },
      { $group: { _id: null, total: { $sum: "$items.price" } } },
    ]);
    const totalSales =
      totalSalesForPeriod.length > 0 ? totalSalesForPeriod[0].total : 1;

    const topProducts = topProductsData.map((p) => ({
      name: p.name,
      percentage: (p.totalSold / totalSales) * 100,
    }));

    // --- Total Report ---
    const totalReport = orderedMonthLabels.map((month, index) => ({
      reportName: `${month} Revenue Report`,
      percentage:
        (monthlyRevenue[index] / summary.monthlyRevenue.value) * 100 || 0,
      lastUpdated: new Date(),
      fileFormat: "PDF",
      action: "Download",
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

export const exportUserGrowthChart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userGrowthChart = await _getUserGrowthChartData();

    const doc = new PDFDocument({ margin: 50 });
    const reportName = "User_Growth_Chart.pdf";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${reportName}"`
    );
    doc.pipe(res);

    doc.fontSize(20).text("User Growth Chart", { align: "center" });
    doc.moveDown(2);

    const tableTop = doc.y;
    const monthX = 50;
    const newUsersX = 250;
    const returningUsersX = 450;

    doc
      .fontSize(10)
      .text("Month", monthX, tableTop)
      .text("New Users", newUsersX, tableTop)
      .text("Returning Users", returningUsersX, tableTop);

    doc
      .moveTo(monthX - 10, doc.y)
      .lineTo(returningUsersX + 100, doc.y)
      .stroke();
    doc.moveDown();

    userGrowthChart.forEach((row) => {
      const y = doc.y;
      doc
        .fontSize(10)
        .text(row.month, monthX, y)
        .text(row.newUsers.toString(), newUsersX, y)
        .text(row.returningUsers.toString(), returningUsersX, y);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const period = parseInt(req.query.period as string, 10) || 7;
    const now = new Date();
    const startDate = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);

    // Top-level stats
    const totalUsers = await User.countDocuments();
    const totalListings = await Product.countDocuments();
    const totalTransactions = await Transaction.countDocuments({ status: "completed" });
    const reports = await Order.countDocuments({ status: "paid" });

    // User Growth Chart (New vs. Returning Users)
    const userGrowthChart = await _getUserGrowthChartData();

    // Top Products
    const topProductsData = await Order.aggregate([
      { $match: { status: "paid", createdAt: { $gte: startDate } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $lookup: {
            from: "categories",
            localField: "productDetails.category",
            foreignField: "_id",
            as: "categoryDetails"
        }
      },
      { $unwind: "$categoryDetails" },
      {
        $group: {
          _id: "$categoryDetails.name",
          totalSold: { $sum: "$items.price" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    const totalSalesForPeriod = await Order.aggregate([
        { $match: { status: "paid", createdAt: { $gte: startDate } } },
        { $unwind: "$items" },
        { $group: { _id: null, total: { $sum: "$items.price" } } },
    ]);
    const totalSales = totalSalesForPeriod.length > 0 ? totalSalesForPeriod[0].total : 1;

    const topProducts = topProductsData.map((p) => ({
        name: p._id,
        percentage: (p.totalSold / totalSales) * 100,
    }));

    // Pending Listings
    const pendingListings = await Product.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("name price createdAt");

    // Sales Record
    const salesRecord = await Order.find({ status: { $in: ["paid", "pending", "failed"] } })
        .sort({ createdAt: -1 })
        .limit(4)
        .populate({
            path: "items.product",
            model: "Product",
            select: "name price productImage"
        })
        .select("items status createdAt");

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalListings,
        totalTransactions,
        reports,
        userGrowthChart,
        topProducts,
        pendingListings,
        salesRecord,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportMonthlyReport = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      handleError(res, 400, "Year and month are required.");
      return;
    }

    const yearNum = parseInt(year as string);
    const monthNum = parseInt(month as string);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      handleError(res, 400, "Invalid year or month provided.");
      return;
    }

    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0); // Last day of the month

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: "paid",
    })
      .populate({
        path: "items.product",
        model: "Product",
      })
      .populate({
        path: "user",
        model: "User",
        select: "fullName email",
      });

    const doc = new (require("jspdf").jsPDF)();
    let yOffset = 10;

    doc.setFontSize(18);
    doc.text(`Monthly Sales Report - ${monthNum}/${yearNum}`, 10, yOffset);
    yOffset += 10;

    doc.setFontSize(12);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 10, yOffset);
    yOffset += 10;

    doc.text("Sales:", 10, yOffset);
    yOffset += 10;

    orders.forEach((order: any) => {
      doc.text(`  Order ID: ${order._id}`, 10, yOffset);
      yOffset += 7;
      doc.text(
        `  Customer: ${order.user?.fullName || "N/A"} (${order.user?.email || "N/A"})`,
        10,
        yOffset
      );
      yOffset += 7;
      doc.text(
        `  Product: ${order.items[0].product?.name || "N/A"}`,
        10,
        yOffset
      );
      yOffset += 7;
      doc.text(`  Amount: #${order.items[0].price.toFixed(2)}`, 10, yOffset);
      yOffset += 7;
      doc.text(`  Date: ${order.createdAt.toLocaleDateString()}`, 10, yOffset);
      yOffset += 10;

      if (yOffset > 280) {
        doc.addPage();
        yOffset = 10;
      }
    });

    const pdfBuffer = doc.output("arraybuffer");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=monthly_report_${monthNum}_${yearNum}.pdf`
    );
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("Error exporting monthly report:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const exportAnalyticsReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const period = parseInt(req.query.period as string, 10) || 30;
    const now = new Date();
    const startDate = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);

    // Fetch summary data
    const summary = await _getAnalyticsSummary(period);

    // Fetch transactions for the period
    const transactions = await Transaction.find({
      status: "completed",
      transactionDate: { $gte: startDate },
    })
      .populate({
        path: "userId",
        model: "User",
        select: "fullName email",
      })
      .sort({ transactionDate: -1 });

    const doc = new PDFDocument({ margin: 50 });
    const reportName = `Analytics_Report_Last_${period}_Days.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${reportName}"`
    );
    doc.pipe(res);

    // --- PDF Content ---
    doc
      .fontSize(20)
      .text(`Analytics Report - Last ${period} Days`, { align: "center" });
    doc.moveDown(2);

    // Summary Section
    doc.fontSize(16).text("Period Summary", { underline: true });
    doc.moveDown();
    doc
      .fontSize(12)
      .text(
        `Active Users: ${summary.activeUsers.value} (${summary.activeUsers.percentageChange.toFixed(2)}%)`
      );
    doc.text(
      `Revenue: $${summary.monthlyRevenue.value.toFixed(2)} (${summary.monthlyRevenue.percentageChange.toFixed(2)}%)`
    );
    doc.text(
      `Commission: $${summary.commission.value.toFixed(2)} (${summary.commission.percentageChange.toFixed(2)}%)`
    );
    doc.moveDown(2);

    // Table Header
    doc.fontSize(14).text("Detailed Transactions", { underline: true });
    doc.moveDown();
    const tableTop = doc.y;
    const itemX = 50;
    const dateX = 150;
    const typeX = 250;
    const amountX = 350;
    const statusX = 450;

    doc
      .fontSize(10)
      .text("User", itemX, tableTop)
      .text("Date", dateX, tableTop)
      .text("Description", typeX, tableTop)
      .text("Amount", amountX, tableTop, { width: 100, align: "right" })
      .text("Status", statusX, tableTop);

    doc
      .moveTo(itemX - 10, doc.y)
      .lineTo(statusX + 100, doc.y)
      .stroke();
    doc.moveDown();

    // Table Rows
    transactions.forEach((tx) => {
      const user = tx.userId as any;
      const y = doc.y;
      doc
        .fontSize(10)
        .text(user?.fullName || "N/A", itemX, y, { width: 90, ellipsis: true })
        .text(tx.transactionDate.toLocaleDateString(), dateX, y)
        .text(tx.description || "", typeX, y, { width: 90, ellipsis: true })
        .text(`#${tx.amount.toFixed(2)}`, amountX, y, {
          width: 100,
          align: "right",
        })
        .text(tx.status, statusX, y);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};
