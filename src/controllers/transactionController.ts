import { Request, Response, NextFunction } from "express";
import { Transaction } from "../models/transactionModel";
import { paginated_result } from "../utils/pagination";
import { createNotification } from "./notificationController";
import { sendEmail } from "../utils/mail";
import { User } from "../models/userModel";
import paystack from "../service/paystack";
import { Order } from "../models/order";
import { Admin } from "../models/adminModel";
import { CreateNotificationData } from "../types/model";
import { ITransaction } from "../types/model";
import { Product } from "../models/productList";

export const getTransactionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transactionId } = req.params;
    const user = (req as any).user;
    const isAdmin = (req as any).admin;

    const transaction = (await Transaction.findById(
      transactionId
    )) as ITransaction;

    if (!transaction) {
       res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
      return;
    }

    if (
      !isAdmin &&
      transaction.userId.toString() !== user._id.toString()
    ) {
       res.status(403).json({
        success: false,
        message: "You are not authorized to view this transaction",
      });
      return;
    }

    // Populate user information
    await transaction.populate([
      { path: "userId", select: "fullName email" },
      { path: "refundRequest.requestedBy", select: "fullName email" },
      { path: "refundHistory.performedBy", select: "fullName email role" },
      { path: "refundDetails.processedBy", select: "fullName email role" },
    ]);

    let orderDetails = null;
    if (transaction.referenceId && transaction.referenceId.startsWith("order_")) {
      const orderId = transaction.referenceId.split("_")[1];
      const order = await Order.findById(orderId).populate({
        path: "items.product",
        model: Product,
        select: "name description price productImage",
      });
      if (order) {
        orderDetails = order;
      }
    }

     res.status(200).json({
      success: true,
      message: "Transaction retrieved successfully",
      data: {
        transaction,
        orderDetails,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Number(req.query.page) || 1;
    const per_page = Number(req.query.limit) || 10;
    const { status, transactionType, userId, startDate, endDate } = req.query;

    const filters: any = {};

    if (status) filters.status = status;
    if (transactionType) filters.transactionType = transactionType;
    if (userId) filters.userId = userId;

    if (startDate || endDate) {
      filters.transactionDate = {};
      if (startDate)
        filters.transactionDate.$gte = new Date(startDate as string);
      if (endDate) filters.transactionDate.$lte = new Date(endDate as string);
    }

    // Count total number of transactions matching the filters
    const count = await Transaction.countDocuments(filters);

    // Handle page overflow
    if ((page - 1) * per_page >= count) {
      res.status(200).json({
        success: true,
        message: "No transactions on this page",
        data: paginated_result(page, per_page, count, []),
      });
      return;
    }

    // Query the transactions collection using filters, pagination and sort
    const transactions = await Transaction.find(filters)
      .sort({ createdAt: -1 })
      .skip((page - 1) * per_page)
      .limit(per_page);

    res.status(200).json({
      success: true,
      message: "Transactions fetched successfully",
      data: paginated_result(page, per_page, count, transactions),
    });
  } catch (error) {
    next(error);
  }
};

export const approveOrRejectRefund = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transactionId } = req.params;
    const { action, adminNotes } = req.body;
    const adminId = (req as any).user?._id;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      res.status(404).json({
        success: false,
        message: "Transaction not found.",
        data: null,
      });
      return;
    }

    if (transaction.status !== "refund") {
      res.status(400).json({
        success: false,
        message: "This transaction is not marked for refund.",
        data: null,
      });
      return;
    }

    // Prevent duplicate approval/rejection
    if (transaction.refundStatus !== "pending") {
      res.status(400).json({
        success: false,
        message: `Refund has already been ${transaction.refundStatus}.`,
        data: null,
      });
      return;
    }

    // Check if order is older than 5 days before approving refund
    if (action === "approve") {
      if (!transaction.referenceId) {
        res.status(400).json({
          success: false,
          message: "Transaction reference ID not found",
          data: null,
        });
        return;
      }

      const orderId = transaction.referenceId.split("_")[1];
      const order = await Order.findById(orderId);

      if (!order) {
        res.status(404).json({
          success: false,
          message: "Order not found",
          data: null,
        });
        return;
      }

      // Check if order is more than 5 days old
      const fiveDaysInMs = 5 * 24 * 60 * 60 * 1000;
      const orderAge = Date.now() - new Date(order.createdAt).getTime();

      if (orderAge > fiveDaysInMs) {
        res.status(400).json({
          success: false,
          message: "Refund cannot be approved for orders older than 5 days.",
          data: null,
        });
        return;
      }
    }

    // Update refund status
    transaction.refundStatus = action === "approve" ? "approved" : "rejected";

    // Add admin notes if provided
    if (adminNotes && transaction.refundRequest) {
      transaction.refundRequest.adminNotes = adminNotes;
    }

    // Add to refund history
    if (!transaction.refundHistory) {
      transaction.refundHistory = [];
    }
    transaction.refundHistory.push({
      action:
        action === "approve"
          ? "Refund approved by admin"
          : "Refund rejected by admin",
      performedBy: adminId,
      performedAt: new Date(),
      notes: adminNotes || `Refund ${action}d by admin`,
    });

    let paystackRefundResult = null;

    // If approved, process refund with Paystack
    if (action === "approve") {
      try {
        if (!transaction.referenceId) {
          throw new Error("Transaction reference ID not found");
        }

        const order = await Order.findById(
          transaction.referenceId.split("_")[1]
        ).populate<{
          items: { product: any }[];
        }>("items.product");
        if (!order) {
          throw new Error("Order not found");
        }

        // Deduct seller's pending balance for each product in the order
        for (const item of order.items) {
          const product = item.product;
          if (product && product.seller) {
            const seller = await User.findById(product.seller);
            if (seller && seller.accountDetail) {
              // Calculate the seller's earnings for this product (95% of the product price)
              const productEarnings = item.product.price * 0.95;

              // Ensure seller has sufficient pending balance
              if (
                (seller.accountDetail.pendingBalance || 0) >= productEarnings
              ) {
                seller.accountDetail.pendingBalance =
                  (seller.accountDetail.pendingBalance || 0) - productEarnings;
                await seller.save();

                // Create a debit transaction record for the seller
                await Transaction.create({
                  userId: seller.id.toString(),
                  amount: productEarnings,
                  transactionType: "debit",
                  status: "completed",
                  description: `Refund deduction for product: "${product.name}"`,
                  transactionDate: new Date(),
                });

                // Notify seller about the deduction
                const sellerNotificationData: CreateNotificationData = {
                  recipient: seller._id as string,
                  recipientModel: "User" as const,
                  body: `NGN ${productEarnings} has been deducted from your pending balance due to a refund for product "${product.name}"`,
                  type: "refund",
                  title: "Refund Deduction",
                };

                await createNotification(sellerNotificationData);
              }
            }
          }
        }

        // Process refund with Paystack
        paystackRefundResult = await paystack.processRefund(
          transaction.referenceId,
          transaction.amount
        );

        // Update transaction with refund details
        transaction.refundDetails = {
          paystackRefundId: paystackRefundResult.id,
          refundAmount: transaction.amount,
          processedAt: new Date(),
          processedBy: adminId,
        };

        transaction.refundStatus = "processed";
        transaction.status = "refunded";

        // Add successful processing to history
        transaction.refundHistory.push({
          action: "Refund processed with Paystack",
          performedBy: adminId,
          performedAt: new Date(),
          notes: `Paystack refund ID: ${paystackRefundResult.id}`,
        });

        // Update related order status
        const orderId = transaction.referenceId?.split("_")[1];
        if (orderId) {
          const order = await Order.findById(orderId);
          if (order) {
            order.status = "refunded";
            await order.save();
          }
        }
      } catch (paystackError: any) {
        console.error("Paystack refund failed:", paystackError.message);

        transaction.refundHistory.push({
          action: "Paystack refund failed",
          performedBy: adminId,
          performedAt: new Date(),
          notes: `Error: ${paystackError.message}`,
        });

        // Keep status as approved, but don't mark as processed
        transaction.refundStatus = "approved";
      }
    }

    await transaction.save();

    const user = await User.findById(transaction.userId).select("email");
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found for this transaction.",
        data: null,
      });
      return;
    }

    // Create comprehensive notifications
    const userNotificationData: CreateNotificationData = {
      recipient: user._id as string,
      recipientModel: "User" as const,
      body:
        action === "approve"
          ? `Your refund of ₦${transaction.amount} has been approved and ${paystackRefundResult ? "processed" : "will be processed shortly"}.`
          : `Your refund request for ₦${transaction.amount} has been rejected. ${adminNotes ? "Reason: " + adminNotes : ""}`,
      type: "refund",
      title: "Refund Request Update",
    };

    // Send notifications and emails
    await Promise.allSettled([
      createNotification(userNotificationData),
      sendEmail(
        user.email!,
        "Refund Request Update",
        action === "approve"
          ? `Your refund of ₦${transaction.amount} (Transaction ID: ${transaction._id}) has been approved and ${paystackRefundResult ? "processed successfully" : "will be processed shortly"}. ${paystackRefundResult ? "Refund ID: " + paystackRefundResult.id : ""}`
          : `Your refund request for ₦${transaction.amount} (Transaction ID: ${transaction._id}) has been rejected. ${adminNotes ? "Reason: " + adminNotes : ""}`
      ),
    ]);

    res.status(200).json({
      success: true,
      message: `Refund ${action}d successfully.${paystackRefundResult ? " Paystack refund processed." : ""}`,
      data: {
        transaction,
        paystackRefund: paystackRefundResult,
      },
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const getRefundHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId)
      .populate("refundRequest.requestedBy", "fullName email")
      .populate("refundHistory.performedBy", "fullName email")
      .populate("refundDetails.processedBy", "fullName email");

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: "Transaction not found.",
        data: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Refund history retrieved successfully.",
      data: {
        transactionId: transaction._id,
        refundRequest: transaction.refundRequest,
        refundStatus: transaction.refundStatus,
        refundDetails: transaction.refundDetails,
        refundHistory: transaction.refundHistory,
      },
    });
    return;
  } catch (error) {
    next(error);
  }
};

// User endpoint to create a refund request
export const createRefundRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user?._id;

    // Validate reason
    if (!reason || reason.trim() === "" || reason.trim().length < 10) {
      res.status(400).json({
        success: false,
        message:
          "Refund reason is required and must be at least 10 characters long.",
        data: null,
      });
      return;
    }

    if (reason.trim().length > 500) {
      res.status(400).json({
        success: false,
        message: "Refund reason cannot exceed 500 characters.",
        data: null,
      });
      return;
    }

    // Find transaction with populated user data
    const transaction = await Transaction.findById(transactionId).populate(
      "userId",
      "fullName email"
    );

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: "Transaction not found.",
        data: null,
      });
      return;
    }

    // Verify transaction belongs to user
    if (transaction.userId !== userId.toString()) {
      res.status(403).json({
        success: false,
        message: "You can only request refunds for your own transactions.",
        data: null,
      });
      return;
    }

    // Check if transaction is eligible for refund
    if (transaction.status !== "completed") {
      res.status(400).json({
        success: false,
        message: "Only completed transactions can be refunded.",
        data: null,
      });
      return;
    }

    // Check transaction age (must be within 5 days for refund eligibility)
    const fiveDaysInMs = 5 * 24 * 60 * 60 * 1000;
    const transactionAge =
      Date.now() - new Date(transaction.transactionDate).getTime();

    if (transactionAge > fiveDaysInMs) {
      res.status(400).json({
        success: false,
        message:
          "Refund requests can only be made within 5 days of the transaction.",
        data: null,
      });
      return;
    }

    // Prevent duplicate refund requests
    if (transaction.refundRequest?.reason) {
      res.status(400).json({
        success: false,
        message: "Refund request already exists for this transaction.",
        data: null,
      });
      return;
    }

    // Set refund request data
    transaction.refundRequest = {
      reason: reason.trim(),
      requestedBy: userId,
      requestedAt: new Date(),
    };
    transaction.status = "refund";
    transaction.refundStatus = "pending";

    // Add to refund history
    if (!transaction.refundHistory) {
      transaction.refundHistory = [];
    }
    transaction.refundHistory.push({
      action: "Refund requested",
      performedBy: userId,
      performedAt: new Date(),
      notes: reason.trim(),
    });

    await transaction.save();

    // Create notification for user
    const userNotificationData: CreateNotificationData = {
      recipient: userId as string,
      recipientModel: "User" as const,
      body: `Your refund request for ₦${transaction.amount} has been submitted and is pending admin review.`,
      type: "refund",
      title: "Refund Request Submitted",
    };

    // Create notification for admins (get all admin IDs)
    const admins = await Admin.find({ is_admin: true }).select("_id");
    const adminNotificationPromises = admins.map((admin) =>
      createNotification({
        recipient: admin._id as string,
        recipientModel: "Admin" as const,
        body: `New refund request for ₦${transaction.amount} (Transaction ID: ${transaction._id})`,
        type: "refund",
        title: "New Refund Request",
      })
    );

    await createNotification(userNotificationData);
    await Promise.all(adminNotificationPromises);

    res.status(201).json({
      success: true,
      message: "Refund request created successfully.",
      data: {
        transactionId: transaction._id,
        amount: transaction.amount,
        refundStatus: transaction.refundStatus,
        requestedAt: transaction.refundRequest.requestedAt,
        reason: transaction.refundRequest.reason,
      },
    });
    return;
  } catch (error) {
    next(error);
  }
};

// User endpoint to get their own transactions
export const getUserTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?._id;
    const page = Number(req.query.page) || 1;
    const per_page = Number(req.query.limit) || 10;
    const { status, transactionType, startDate, endDate } = req.query;

    const filters: any = { userId: userId.toString() };

    if (status) filters.status = status;
    if (transactionType) filters.transactionType = transactionType;

    if (startDate || endDate) {
      filters.transactionDate = {};
      if (startDate)
        filters.transactionDate.$gte = new Date(startDate as string);
      if (endDate) filters.transactionDate.$lte = new Date(endDate as string);
    }

    const count = await Transaction.countDocuments(filters);

    if ((page - 1) * per_page >= count) {
      res.status(200).json({
        success: true,
        message: "No transactions on this page",
        data: paginated_result(page, per_page, count, []),
      });
      return;
    }

    const transactions = await Transaction.find(filters)
      .sort({ createdAt: -1 })
      .skip((page - 1) * per_page)
      .limit(per_page);

    res.status(200).json({
      success: true,
      message: "Transactions fetched successfully",
      data: paginated_result(page, per_page, count, transactions),
    });
  } catch (error) {
    next(error);
  }
};

// User endpoint to get refund status for their transaction
export const getUserRefundStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transactionId } = req.params;
    const userId = (req as any).user?._id;

    const transaction = await Transaction.findById(transactionId)
      .populate("refundRequest.requestedBy", "fullName email")
      .populate("refundHistory.performedBy", "fullName email")
      .populate("refundDetails.processedBy", "fullName email");

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: "Transaction not found.",
        data: null,
      });
      return;
    }

    // Verify user owns this transaction
    if (transaction.userId !== userId.toString()) {
      res.status(403).json({
        success: false,
        message: "You can only view refund status for your own transactions.",
        data: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Refund status retrieved successfully.",
      data: {
        transactionId: transaction._id,
        amount: transaction.amount,
        refundRequest: transaction.refundRequest,
        refundStatus: transaction.refundStatus,
        refundDetails: transaction.refundDetails,
        refundHistory: transaction.refundHistory,
      },
    });
    return;
  } catch (error) {
    next(error);
  }
};

// Admin endpoint to get all refund requests
export const getAllRefundRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Number(req.query.page) || 1;
    const per_page = Number(req.query.limit) || 10;
    const { status, startDate, endDate, userId } = req.query;

    // Build filters for refund requests
    const filters: any = {
      refundRequest: { $exists: true },
    };

    // Add optional filters
    if (
      status &&
      ["pending", "approved", "rejected", "processed"].includes(
        status as string
      )
    ) {
      filters.refundStatus = status;
    }

    if (userId) {
      filters.userId = userId;
    }

    // Date range filter
    if (startDate || endDate) {
      filters["refundRequest.requestedAt"] = {};
      if (startDate) {
        filters["refundRequest.requestedAt"].$gte = new Date(
          startDate as string
        );
      }
      if (endDate) {
        filters["refundRequest.requestedAt"].$lte = new Date(endDate as string);
      }
    }

    const count = await Transaction.countDocuments(filters);

    if ((page - 1) * per_page >= count) {
      res.status(200).json({
        success: true,
        message: "No refund requests on this page",
        data: paginated_result(page, per_page, count, []),
      });
      return;
    }

    const refundRequests = await Transaction.find(filters)
      .populate("refundRequest.requestedBy", "fullName email")
      .populate("refundHistory.performedBy", "fullName email role")
      .populate("refundDetails.processedBy", "fullName email role")
      .populate("userId", "fullName email")
      .sort({ "refundRequest.requestedAt": -1 })
      .skip((page - 1) * per_page)
      .limit(per_page)
      .select({
        _id: 1,
        userId: 1,
        amount: 1,
        transactionDate: 1,
        status: 1,
        refundStatus: 1,
        refundRequest: 1,
        refundDetails: 1,
        refundHistory: 1,
        referenceId: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
      });

    // Calculate summary statistics
    const summary = await Transaction.aggregate([
      { $match: { refundRequest: { $exists: true }, status: "refund" } },
      {
        $group: {
          _id: "$refundStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const summaryData = {
      pending: { count: 0, totalAmount: 0 },
      approved: { count: 0, totalAmount: 0 },
      rejected: { count: 0, totalAmount: 0 },
      processed: { count: 0, totalAmount: 0 },
    };

    summary.forEach((item) => {
      if (item._id && summaryData[item._id as keyof typeof summaryData]) {
        summaryData[item._id as keyof typeof summaryData] = {
          count: item.count,
          totalAmount: item.totalAmount,
        };
      }
    });

    res.status(200).json({
      success: true,
      message: "Refund requests retrieved successfully",
      data: paginated_result(page, per_page, count, refundRequests),
      summary: summaryData,
    });
    return;
  } catch (error) {
    next(error);
  }
};
