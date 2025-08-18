import { Request, Response, NextFunction } from "express";
import { Transaction } from "../models/transactionModel";
import { paginated_result } from "../utils/pagination";
import { createNotification } from "./notificationController";
import { sendEmail } from "../utils/mail";
import { User } from "../models/userModel";
import paystack from "../service/paystack";
import { Order } from "../models/order";
import { Admin } from "../models/adminModel";

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

        // Process refund with Paystack
        paystackRefundResult = await paystack.processRefund(
          transaction.referenceId,
          transaction.amount,
          `Refund approved for transaction ${transaction._id}`
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
    const userNotificationData = {
      recipient: user._id,
      recipientModel: "User",
      body:
        action === "approve"
          ? `Your refund of ₦${transaction.amount} has been approved and ${paystackRefundResult ? "processed" : "will be processed shortly"}.`
          : `Your refund request for ₦${transaction.amount} has been rejected. ${adminNotes ? "Reason: " + adminNotes : ""}`,
      type: "refund",
      title: "Refund Request Update",
      data: {
        transactionId: transaction._id,
        amount: transaction.amount,
        status: transaction.refundStatus,
        paystackRefundId: paystackRefundResult?.id,
      },
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
    if (!reason || reason.trim() === "") {
      res.status(400).json({
        success: false,
        message: "Refund reason is required.",
        data: null,
      });
      return;
    }

    // Find transaction
    const transaction = await Transaction.findById(transactionId);

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

    // Prevent duplicate refund requests
    if (transaction.refundRequest) {
      res.status(400).json({
        success: false,
        message: "Refund request already exists for this transaction.",
        data: null,
      });
      return;
    }

    // Set refund request data
    transaction.refundRequest = {
      reason,
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
      notes: reason,
    });

    await transaction.save();

    // Create notification for user
    const userNotificationData = {
      recipient: userId,
      recipientModel: "User",
      body: `Your refund request for ₦${transaction.amount} has been submitted and is pending admin review.`,
      type: "refund",
      title: "Refund Request Submitted",
      data: {
        transactionId: transaction._id,
        amount: transaction.amount,
      },
    };

    // Create notification for admins (get all admin IDs)
    const admins = await Admin.find({ is_admin: true }).select("_id");
    const adminNotificationPromises = admins.map((admin) =>
      createNotification({
        recipient: admin._id,
        recipientModel: "Admin",
        body: `New refund request for ₦${transaction.amount} (Transaction ID: ${transaction._id})`,
        type: "refund",
        title: "New Refund Request",
        data: {
          transactionId: transaction._id,
          amount: transaction.amount,
          userId: userId,
        },
      })
    );

    await createNotification(userNotificationData);
    await Promise.all(adminNotificationPromises);

    res.status(201).json({
      success: true,
      message: "Refund request created successfully.",
      data: transaction,
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
