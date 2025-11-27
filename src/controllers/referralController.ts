import { Request, Response, NextFunction } from "express";
import { User } from "../models/userModel";
import { Transaction } from "../models/transactionModel";
import { handleError } from "../error/errorHandler";
import _ from "lodash";

/**
 * Get all users referred by the logged-in user
 */
export const getReferredUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Find all users referred by this user
    const referredUsers = await User.find({ referredBy: userId })
      .select("fullName email createdAt")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get total count
    const totalCount = await User.countDocuments({ referredBy: userId });

    // Calculate total referral rewards earned
    // Find all transactions where the description contains "Referral reward"
    const referralRewardTransactions = await Transaction.find({
      userId: userId,
      description: /Referral reward/i,
      status: "completed",
    });

    const totalRewardsEarned = referralRewardTransactions.reduce(
      (sum, txn) => sum + (txn.amount || 0),
      0
    );

    res.status(200).json({
      success: true,
      data: {
        referredUsers,
        totalCount,
        totalRewardsEarned,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get who referred the logged-in user
 */
export const getReferrer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user._id;

    // Find the logged-in user and populate referrer
    const user = await User.findById(userId).populate(
      "referredBy",
      "fullName email referralCode"
    );

    if (!user) {
      return handleError(res, 404, "User not found.");
    }

    // If user was not referred by anyone
    if (!user.referredBy) {
       res.status(200).json({
        success: true,
        data: null,
        message: "You were not referred by anyone.",
      });
      return;
    }

    // Return referrer details
    const referrerData = _.pick(user.referredBy, [
      "fullName",
      "email",
      "referralCode",
    ]);

    res.status(200).json({
      success: true,
      data: referrerData,
    });
  } catch (error) {
    next(error);
  }
};
