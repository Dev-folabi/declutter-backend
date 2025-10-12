import { Order } from "../models/order";
import { Product } from "../models/productList";
import { Transaction } from "../models/transactionModel";

export const cancelExpiredTransactions = async () => {
  try {
    const now = new Date();
    const expiredTransactions = await Transaction.find({
      status: "pending",
      expiresAt: { $lte: now },
    });

    if (expiredTransactions.length === 0) {
      console.log("No expired transactions to cancel.");
      return;
    }

    for (const transaction of expiredTransactions) {
      transaction.status = "cancelled";
      await transaction.save();

      const orderId = transaction.referenceId?.split("_")[1];
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order) {
          // Release reserved products
          for (const item of order.items) {
            await Product.findByIdAndUpdate((item.product as any)._id, {
              $set: { is_reserved: false },
              $unset: { reserved_at: "" },
            });
          }
        }
      }
    }

    console.log(`Cancelled ${expiredTransactions.length} expired transactions and released associated products.`);
  } catch (error) {
    console.error("Error cancelling expired transactions:", error);
  }
};
