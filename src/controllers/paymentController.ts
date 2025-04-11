import { Request, Response, NextFunction } from "express";
import paystack from "../service/paystack";
import { Order } from "../models/order";
import { Transaction } from "../models/transactionModel";
import { getEnvironment } from "../function/environment";
import crypto from "crypto";
import { User } from "../models/userModel";
import { ProductListingType } from "../types/model";
import { createNotification } from "./notificationController";
import { sendEmail } from "../utils/mail";
import bcrypt from "bcrypt";
import { decryptAccountDetail } from "../utils";

const environment = getEnvironment();

const PAYSTACK_WEBHOOK_SECRET =
  environment === "local" || environment === "staging"
    ? process.env.PAYSTACK_LIVE_SECRET_KEY!
    : process.env.PAYSTACK_TEST_SECRET_KEY!;

export const getBankCodes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await paystack.getBankCodes();

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getAccountDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { account_number, bank_code } = req.query;

    if (!account_number || !bank_code) {
      res.status(400).json({
        status: "error",
        message: "Account number and bank code are required",
      });
    }

    const response = await paystack.getAccountDetails(
      account_number as string,
      bank_code as string
    );

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error(
      "Error retrieving account details:",
      error?.response?.data || error.message
    );
    next(error);
  }
};

// Initiate Payment
export const initiateOrderPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { order_id } = req.params;
  const userId = (req as any).user._id;

  try {
    // Find the order by ID and ensure it's associated with the authenticated user
    const order = await Order.findOne({ _id: order_id, user: userId }).populate(
      "user"
    );

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found or you do not have access to this order",
        data: null,
      });
      return;
    }

    const charges = order.totalPrice * 0.015 + 100;
    order.totalPrice += charges;

    // Initiate the payment using Paystack
    const paymentData = await paystack.initiatePayment(
      (order.user as any).email,
      order.totalPrice,
      `txn_${order._id}`
    );

    // Record the transaction in the database
    const transaction = new Transaction({
      userId: order.user.toString(),
      amount: order.totalPrice,
      transactionDate: new Date(),
      status: "pending",
      charges,
      transactionType: "credit",
      description: `Payment for Order ${order._id}`,
      referenceId: paymentData.reference,
    });

    await transaction.save();

    // Respond with payment initiation data
    res.status(200).json({
      success: true,
      message: "Payment initiated successfully",
      data: paymentData,
    });
  } catch (error: any) {
    next(error);
  }
};

export const verifyPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { reference } = req.query;
  const userId = (req as any).user._id;

  try {
    if (!reference) {
      res
        .status(400)
        .json({ success: false, message: "Payment reference is required." });
      return;
    }

    const transaction = await Transaction.findOne({ referenceId: reference });
    if (!transaction) {
      res
        .status(404)
        .json({ success: false, message: "Transaction not found." });
      return;
    }

    if (["completed", "refund"].includes(transaction.status)) {
      res
        .status(200)
        .json({ success: true, message: "Transaction already processed." });
      return;
    }

    if (transaction.userId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to verify this payment.",
      });
      return;
    }

    const paymentData = await paystack.verifyPayment(reference as string);
    if (paymentData.status !== "success") {
      res.status(400).json({
        success: false,
        message: "Payment verification failed.",
        data: paymentData,
      });
      return;
    }

    if (paymentData.amount / 100 !== transaction.amount) {
      res.status(400).json({
        success: false,
        message: "Payment amount mismatch.",
        data: paymentData,
      });
      return;
    }

    transaction.status = "completed";
    transaction.transactionDate = new Date();
    await transaction.save();

    const orderId = transaction.referenceId?.split("_")[1];
    if (!orderId) {
      res.status(400).json({
        success: false,
        message: "Order ID is missing from reference ID.",
      });
      return;
    }

    const order = await Order.findById(orderId).populate<{
      items: { product: ProductListingType }[];
    }>("items.product");

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found." });
      return;
    }

    order.status = "paid";
    await order.save();

    // Handle each product in the order
    for (const item of order.items) {
      const product = item.product;
      if (product && !product.is_sold) {
        product.is_sold = true;
        await product.save();

        const seller = await User.findById(product.seller);
        if (seller && seller.accountDetail) {
          const creditAmount = transaction.amount * 0.95;
          seller.accountDetail.pendingBalance =
            (seller.accountDetail.pendingBalance || 0) + creditAmount;
          await seller.save();

          console.log(
            `Notified seller ${seller.email}: Product "${product.name}" sold. Ref: ${reference}`
          );

          const notificationData = {
            user: seller._id,
            body: `Your Product "${product.name}" has been sold and credited with NGN ${creditAmount}`,
            type: "market",
            title: "Product Sales",
          };

          await Promise.allSettled([
            createNotification(notificationData),
            sendEmail(
              seller.email!,
              "Product Sales",
              `Your Product "${product.name}" has been sold and credited with NGN ${creditAmount}`
            ),
          ]);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully, order updated, seller credited.",
      data: paymentData,
    });
  } catch (error: any) {
    console.error("Payment verification error:", error.message || error);
    next(error);
  }
};

export const handlePaystackWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const payload = req.body;
  const signature = req.headers["X-Paystack-Signature"] as string;

  try {
    if (!verifyWebhookSignature(payload, signature)) {
      res.status(400).json({
        success: false,
        message: "Invalid signature. Webhook not from Paystack.",
      });
      return;
    }

    const event = payload.event;
    if (event === "charge.success") {
      await handleChargeSuccess(payload.data);
    } else if (event === "charge.failed") {
      await handleChargeFailed(payload.data);
    } else if (event === "refund.success") {
      await handleRefundSuccess(payload.data);
    } else {
      console.log("Unhandled Paystack event:", event);
    }

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully.",
    });
  } catch (error: any) {
    console.error("Webhook processing error:", error.message || error);
    next(error);
  }
};

const verifyWebhookSignature = (payload: any, signature: string) => {
  const computedSignature = crypto
    .createHmac("sha512", PAYSTACK_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");

  return computedSignature === signature;
};

const handleChargeSuccess = async (paymentData: any) => {
  const reference = paymentData.reference;
  const amount = paymentData.amount / 100;
  const transaction = await Transaction.findOne({ referenceId: reference });

  if (!transaction) throw new Error("Transaction not found.");

  if (["completed", "refund"].includes(transaction.status)) {
    return;
  }
  transaction.status = "completed";
  transaction.transactionDate = new Date();
  await transaction.save();

  const orderId = transaction.referenceId?.split("_")[1];
  if (!orderId) throw new Error("Order ID missing from reference.");

  const order = await Order.findById(orderId).populate<{
    items: { product: ProductListingType }[];
  }>("items.product");

  if (!order) throw new Error("Order not found.");

  order.status = "paid";
  await order.save();

  for (const item of order.items) {
    const product = item.product;
    if (product && !product.is_sold) {
      product.is_sold = true;
      await product.save();

      const seller = await User.findById(product.seller);
      if (seller && seller.accountDetail) {
        const creditAmount = transaction.amount * 0.95;
        seller.accountDetail.pendingBalance =
          (seller.accountDetail.pendingBalance || 0) + creditAmount;
        await seller.save();

        const notificationData = {
          user: seller._id,
          body: `Your product "${product.name}" has been sold and credited with NGN ${creditAmount}`,
          type: "account",
          title: "Product Sales",
        };

        await Promise.allSettled([
          createNotification(notificationData),
          sendEmail(
            seller.email!,
            "Product Sold",
            `Your product "${product.name}" has been sold and credited with NGN ${creditAmount}`
          ),
        ]);
      }
    }
  }
};

const handleChargeFailed = async (paymentData: any) => {
  const reference = paymentData.reference;
  const transaction = await Transaction.findOne({ referenceId: reference });
  if (!transaction) throw new Error("Transaction not found.");

  transaction.status = "failed";
  transaction.transactionDate = new Date();
  await transaction.save();

  const orderId = transaction.referenceId?.split("_")[1];
  const order = await Order.findById(orderId);
  if (order) {
    order.status = "failed";
    await order.save();
  }
};

const handleRefundSuccess = async (paymentData: any) => {
  const reference = paymentData.reference;
  const transaction = await Transaction.findOne({ referenceId: reference });
  if (!transaction) throw new Error("Transaction not found.");

  transaction.status = "refund";
  transaction.transactionDate = new Date();
  await transaction.save();

  const orderId = transaction.referenceId?.split("_")[1];
  const order = await Order.findById(orderId);
  if (order) {
    order.status = "refunded";
    await order.save();
  }
};

export const withdrawFunds = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = (req as any).user._id;
  const { amount, pin, accountNumber, bankCode } = req.body;

  try {
    if (!amount || amount < 100) {
      res.status(400).json({
        success: false,
        message: "Minimum withdrawal amount is NGN 100.",
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found.",
      });
      return;
    }

    // Check if user has sufficient balance
    if (
      !user.accountDetail ||
      user.accountDetail.balance === undefined ||
      user.accountDetail.balance < amount
    ) {
      res.status(400).json({
        success: false,
        message: "Insufficient balance or account details not found.",
      });
      return;
    }

    // PIN verification
    const isPinValid = await bcrypt.compare(pin, user.pin || "");
    if (!isPinValid) {
      res.status(403).json({
        success: false,
        message: "Incorrect PIN.",
      });
      return;
    }

    const accountDetail = decryptAccountDetail(user.accountDetail);

    // Validate account details
    if (
      !accountDetail ||
      accountDetail.accountNumber !== accountNumber ||
      accountDetail.bankCode !== bankCode
    ) {
      res.status(400).json({
        success: false,
        message: "Provided account details do not match saved account.",
      });
      return;
    }

    const recipientCode = accountDetail.recipientCode;
    if (!recipientCode) {
      res.status(400).json({
        success: false,
        message: "Recipient code not found. Please complete account setup.",
      });
      return;
    }

    const reference = `WD_${crypto.randomBytes(16).toString("hex")}`;

    // Transfer funds via Paystack
    await paystack.transferFunds(recipientCode, amount, "Wallet Withdrawal");

    // Create a debit transaction
    const transaction = await Transaction.create({
      userId: user._id,
      amount,
      transactionType: "debit",
      status: "completed",
      description: "Wallet Withdrawal",
      referenceId: reference,
      transactionDate: new Date(),
    });

    // Deduct from balance
    user.accountDetail.balance -= amount;
    await user.save();

    const bodyMsg = `You have successfully withdrawn NGN ${amount}. Reference: ${reference}`;

    // Notify user via email & in-app
    Promise.allSettled([
      sendEmail(user.email, "Withdrawal Successful", bodyMsg),
      createNotification({
        user: user._id,
        body: bodyMsg,
        type: "account",
        title: "Wallet Withdrawal",
      }),
    ]);

    res.status(200).json({
      success: true,
      message: "Withdrawal successful.",
      transaction,
    });
  } catch (error: any) {
    console.error("Withdrawal error:", error.message);
    next(error);
  }
};
