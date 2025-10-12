import { Transaction } from "../models/transactionModel";

export const cancelExpiredTransactions = async () => {
  try {
    const now = new Date();
    const result = await Transaction.updateMany(
      {
        status: "pending",
        expiresAt: { $lte: now },
      },
      {
        $set: { status: "cancelled" },
      }
    );

    console.log(`Cancelled ${result.modifiedCount} expired transactions.`);
  } catch (error) {
    console.error("Error cancelling expired transactions:", error);
  }
};
