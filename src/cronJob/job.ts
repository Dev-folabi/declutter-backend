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
        if (!product || product.hasSettled) continue;

        const seller = await User.findById(product.seller);
        if (!seller || !seller.accountDetail) continue;

        const creditAmount = txn.sellerEarnings;

        if (!creditAmount) continue;

        // Ensure there's enough pending balance
        if ((seller.accountDetail.pendingBalance || 0) < creditAmount) continue;

        // Move from pending to available balance
        if (
          seller.accountDetail &&
          typeof seller.accountDetail.pendingBalance === "number" &&
          typeof seller.accountDetail.balance === "number"
        ) {
          seller.accountDetail.pendingBalance -= creditAmount;
          seller.accountDetail.balance += creditAmount;
          await seller.save();
        }

        // Process referral reward if buyer was referred
        const buyer = await User.findById(txn.userId).populate("referredBy");
        if (buyer && buyer.referredBy) {
          const referrer = buyer.referredBy as any;

          // Calculate referral reward: 1% of platform commission (txn.revenue)
          const referralReward = Math.round((txn.revenue || 0) * 0.01);

          if (referralReward > 0 && referrer.accountDetail) {
            // Credit referrer's balance
            referrer.accountDetail.balance =
              (referrer.accountDetail.balance || 0) + referralReward;
            await referrer.save();

            // Create transaction record for referral reward
            await Transaction.create({
              userId: referrer._id,
              amount: referralReward,
              transactionType: "credit",
              description: `Referral reward from ${buyer.fullName}'s purchase`,
              status: "completed",
              transactionDate: new Date(),
            });

            // Send notification to referrer
            const referralMessage = `You earned NGN ${referralReward} as a referral reward from ${buyer.fullName}'s purchase!`;
            await Promise.allSettled([
              createNotification({
                recipient: referrer._id as string,
                recipientModel: "User" as const,
                body: referralMessage,
                title: "Referral Reward Earned",
                type: "account",
              }),
              sendEmail(
                referrer.email!,
                "Referral Reward Earned",
                referralMessage
              ),
            ]);

            console.log(
              `✅ Credited NGN ${referralReward} referral reward to ${referrer.email}`
            );
          }
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
            recipient: seller._id as string,
            recipientModel: "User" as const,
            body: message,
            title: "Earnings Released",
            type: "account",
          }),
          sendEmail(seller.email!, "Earnings Released", message),
        ]);

        console.log(
          `✅ Released NGN ${creditAmount} to seller (${seller.email})`
        );
      }
    }
  } catch (err: any) {
    console.error("❌ Error in balance release job:", err.message);
  }
};
