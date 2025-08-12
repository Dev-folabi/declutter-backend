import { Request, Response, NextFunction } from 'express';
import { Transaction } from '../../models/transactionModel';
import { paginated_result } from '../../utils/pagination'; 
import { createNotification } from "../notificationController";
import { sendEmail } from '../../utils/mail';
import { User } from '../../models/userModel';

export const getAllTransactions = async (req: Request, res: Response, next: NextFunction) => {
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
      if (startDate) filters.transactionDate.$gte = new Date(startDate as string);
      if (endDate) filters.transactionDate.$lte = new Date(endDate as string);
    }

    // Count total number of transactions matching the filters
    const count = await Transaction.countDocuments(filters);

    // Handle page overflow
    if ((page - 1) * per_page >= count) {
      res.status(200).json({
        success: true,
        message: 'No transactions on this page',
        data: paginated_result(page, per_page, count, []),
      });
      return
    }

    // Query the transactions collection using filters, pagination and sort
    const transactions = await Transaction.find(filters)
      .sort({ createdAt: -1 })
      .skip((page - 1) * per_page)
      .limit(per_page);

    res.status(200).json({
      success: true,
      message: 'Transactions fetched successfully',
      data: paginated_result(page, per_page, count, transactions),
    });

  } catch (error) {
    next(error);
  }
};



export const approveOrRejectRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId } = req.params;
    const { action } = req.body;

    const transaction = await Transaction.findById(transactionId)
    if (!transaction ) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found.',
        data: null
      })
      return
    }

    if (transaction.status !== 'refund') {
      res.status(400).json({
        success: false,
        message: 'This transaction is not marked for refund.',
        data: null
      })
      return
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

    transaction.refundStatus = action === 'approve' ? 'approved' : 'rejected';

    await transaction.save();
    const user = await User.findById(transaction.userId).select('email');
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found for this transaction.',
        data: null,
      });
      return;
    }
   
    const notificationData = {
      recipient: user._id,
      recipientModel: 'User',
      body:
        action === 'approve'
          ? `Your refund of ₦${transaction.amount} (Transaction ID: ${transaction._id}) has been approved. The refund will ne processed shortly.`
          : `Your refund request for ₦${transaction.amount} (Transaction ID: ${transaction._id}) has been rejected.`,
      type: 'refund',
      title: 'Refund Request Update',
      data: {
        transactionId: transaction._id,
        amount: transaction.amount,
      },
    };
    
    await Promise.allSettled([
      createNotification(notificationData),
      sendEmail(
        user.email!, 
        'Refund Request Update',
        action === 'approve'
          ? `Your refund of ₦${transaction.amount} (Transaction ID: ${transaction._id}) has been approved and will be processed shortly.`
          : `Your refund request for ₦${transaction.amount} (Transaction ID: ${transaction._id}) has been rejected.`
      )
    ]);
    
    res.status(200).json({
      success: true,
      message: `Refund ${action}d successfully.`,
      data: transaction,
    });
    return
  } catch (error) {
    next(error);
  }
};