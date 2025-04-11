import { createNotification } from "../controllers/notificationController";
import { Order } from "../models/order";
import { Transaction } from "../models/transactionModel";
import { User } from "../models/userModel";
import { ProductListingType } from "../types/model";
import { sendEmail } from "../utils/mail";

const FIVE_DAYS_IN_MS = 5 * 24 * 60 * 60 * 1000;

export const moveFundsAfterFiveDays = async () => {
  const fiveDaysAgo = new Date(Date.now() - FIVE_DAYS_IN_MS);

  try {
    console.log("🔄 Running 5-day pending balance release job...");

    // Find eligible transactions
    const eligibleTransactions = await Transaction.find({
      status: "completed",
      transactionType: "credit",
      transactionDate: { $lte: fiveDaysAgo },
    });

    for (const txn of eligibleTransactions) {
      const orderId = txn.referenceId?.split("_")[1];
      if (!orderId) continue;

      const order = await Order.findById(orderId).populate<{
        items: { product: ProductListingType }[];
      }>("items.product");

      if (!order || order.status !== "paid") continue;

      for (const item of order.items) {
        const product = item.product;
        if (!product || !product.is_sold || product.hasSettled) continue;

        const seller = await User.findById(product.seller);
        if (!seller || !seller.accountDetail) continue;

        const creditAmount = txn.amount * 0.95;

        // Ensure there's enough pending balance
        if ((seller.accountDetail.pendingBalance || 0) < creditAmount) continue;
        
        // Move from pending to available balance
        if (seller.accountDetail && typeof seller.accountDetail.pendingBalance === 'number' && typeof seller.accountDetail.balance === 'number') {
          seller.accountDetail.pendingBalance -= creditAmount;
          seller.accountDetail.balance += creditAmount;
          await seller.save();
        }

        // Mark product as settled to avoid duplicate transfers
        product.hasSettled = true;
        await product.save();

        // Create a new debit record to track balance movement
        await Transaction.create({
          userId: seller._id,
          amount: creditAmount,
          transactionType: "credit",
          description: `Released earnings for sold product: "${product.name}"`,
          status: "completed",
          transactionDate: new Date(),
        });

        // Send notification and email
        const message = `Your earnings of NGN ${creditAmount} for product "${product.name}" have been released to your wallet balance.`;
        await Promise.allSettled([
          createNotification({
            user: seller._id,
            body: message,
            title: "Earnings Released",
            type: "account",
          }),
          sendEmail(seller.email!, "Earnings Released", message),
        ]);

        console.log(`✅ Released NGN ${creditAmount} to seller (${seller.email})`);
      }
    }

  } catch (err: any) {
    console.error("❌ Error in balance release job:", err.message);
  }
};