import { Request, Response, NextFunction } from "express";
import paystack from "../service/paystack";
import { Order } from "../models/order";
import { Transaction } from "../models/transactionModel";
import { getEnvironment } from "../function/environment";
import crypto from "crypto";
import { User } from "../models/userModel";
import {
  CreateNotificationData,
  ITransaction,
  ProductListingType,
} from "../types/model";
import { createNotification } from "./notificationController";
import { sendEmail } from "../utils/mail";
import bcrypt from "bcrypt";
import { decryptAccountDetail, encryptData } from "../utils";
import { calculateEarnings } from "../utils/calculateEarnings";
import { Schema } from "mongoose";
import { Cart } from "../models/cart";
import { Product } from "../models/productList";
import { generateReferenceId } from "../utils/referenceGenerator";

const environment = getEnvironment();

const PAYSTACK_WEBHOOK_SECRET =
  environment === "local" || "staging"
    ? process.env.PAYSTACK_TEST_SECRET_KEY!
    : process.env.PAYSTACK_LIVE_SECRET_KEY!;

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
    // Find and cancel any previous pending transactions for this user
    const pendingTransactions = await Transaction.find({
      userId,
      status: "pending",
    });

    for (const trans of pendingTransactions) {
      trans.status = "cancelled";
      await trans.save();

      const orderId = trans.referenceId?.split("_")[1];

      if (orderId) {
        const oldOrder = await Order.findById(orderId);

        if (oldOrder) {
          for (const item of oldOrder.items) {
            await Product.findByIdAndUpdate((item.product as any)._id, {
              $set: { is_reserved: false },
              $unset: { reserved_at: "" },
            });
          }
        }
      }
    }

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

    // Check product availability and reserve items
    const unavailableItems: string[] = [];
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (!product || product.quantity < item.quantity || product.is_reserved) {
        unavailableItems.push(product ? product.name : "An unknown item");
      }
    }

    if (unavailableItems.length > 0) {
      res.status(400).json({
        success: false,
        message: `The following items are no longer available: ${unavailableItems.join(
          ", "
        )}. Please remove them from your cart and try again.`,
      });
      return;
    }

    // Reserve products
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        if (item.quantity >= product.quantity) {
          await Product.findByIdAndUpdate(item.product, {
            $set: { is_reserved: true, reserved_at: new Date() },
          });
        }
      }
    }

    // Calculate commission & earnings (before adding gateway fee)
    const { totalAmount, gatewayCharges, sellerEarnings, revenue } =
      calculateEarnings(order.totalPrice);

    // Initiate the payment using Paystack
    const referenceId = generateReferenceId(order._id as any);
    const paymentData = await paystack.initiatePayment(
      (order.user as any).email,
      totalAmount,
      referenceId
    );

    // Record the transaction in the database
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    const transaction = new Transaction<ITransaction>({
      userId: (order.user as any)._id,
      amount: order.totalPrice,
      transactionDate: new Date(),
      status: "pending",
      charges: gatewayCharges,
      transactionType: "credit",
      description: `Payment for Order ${order._id}`,
      referenceId: referenceId,
      totalAmount,
      sellerEarnings,
      revenue,
      expiresAt,
    } as ITransaction);

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

    if (transaction.userId.toString() !== userId.toString()) {
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

    if (paymentData.amount / 100 !== transaction.totalAmount) {
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
      const product = item.product; // This is the populated product document
      if (product) {
        // Update product quantity and reservation status
        await Product.findByIdAndUpdate(product._id, {
          $inc: { quantity: -item.product.quantity },
          $set: { is_reserved: false },
          $unset: { reserved_at: "" },
        });

        const seller = await User.findById(product.seller);
        if (seller && seller.accountDetail) {
          const itemCredit = item.product.price * 0.95; // item.price is quantity * unit_price
          seller.accountDetail.pendingBalance =
            (seller.accountDetail.pendingBalance || 0) + itemCredit;
          await seller.save();

          const notificationData: CreateNotificationData = {
            recipient: seller._id as string,
            recipientModel: "User" as const,
            body: `Your product "${product.name}" (x${
              item.product.quantity
            }) has been sold and your pending balance credited with ₦${itemCredit.toFixed(
              2
            )}.`,
            type: "market",
            title: "Product Sold",
          };

          // Notifications can be sent inside the loop
          await Promise.allSettled([
            createNotification(notificationData),
            sendEmail(
              seller.email!,
              "Product Sold",
              `Your product "${product.name}" (x${
                item.product.quantity
              }) has been sold and your pending balance credited with ₦${itemCredit.toFixed(
                2
              )}.`
            ),
          ]);
        }
      }
    }

    // Clear user cart after processing all items in the order
    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = [];
      cart.totalPrice = 0;
      await cart.save();
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

  const signature =
    (req.headers["x-paystack-signature"] as string) ||
    (req.headers["X-Paystack-Signature"] as string);

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
    } else if (event === "refund.processed") {
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
    if (product) {
      await Product.findByIdAndUpdate(product._id, {
        $inc: { quantity: -item.product.quantity },
        $set: { is_reserved: false },
        $unset: { reserved_at: "" },
      });

      const seller = await User.findById(product.seller);
      if (seller && seller.accountDetail) {
        const itemCredit = item.product.price * 0.95;
        seller.accountDetail.pendingBalance =
          (seller.accountDetail.pendingBalance || 0) + itemCredit;
        await seller.save();

        const notificationData: CreateNotificationData = {
          recipient: seller._id as string,
          recipientModel: "User" as const,
          body: `Your product "${product.name}" (x${
            item.product.quantity
          }) has been sold and your pending balance credited with ₦${itemCredit.toFixed(
            2
          )}.`,
          type: "account",
          title: "Product Sold",
        };

        await Promise.allSettled([
          createNotification(notificationData),
          sendEmail(
            seller.email!,
            "Product Sold",
            `Your product "${product.name}" (x${
              item.product.quantity
            }) has been sold and your pending balance credited with ₦${itemCredit.toFixed(
              2
            )}.`
          ),
        ]);
      }
    }
  }

  // Clear user cart after processing all items
  const cart = await Cart.findOne({ user: transaction.userId });
  if (cart) {
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();
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

    // Release reserved products
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        await Product.findByIdAndUpdate(item.product, {
          $set: { is_reserved: false },
          $unset: { reserved_at: "" },
        });
      }
    }
  }
};

const handleRefundSuccess = async (paymentData: any) => {
  const refundId = paymentData.id;
  const reference = paymentData.transaction_reference;

  if (!reference) {
    throw new Error("Transaction reference not found in refund data.");
  }

  const transaction = await Transaction.findOne({ referenceId: reference });
  if (!transaction) {
    throw new Error("Transaction not found.");
  }

  // Update transaction status
  transaction.status = "refunded";
  transaction.refundStatus = "processed";

  // Update refund details if not already set
  if (!transaction.refundDetails) {
    transaction.refundDetails = {
      paystackRefundId: refundId,
      refundAmount: paymentData.amount / 100, // Convert from kobo
      processedAt: new Date(),
    };
  }

  // Add to refund history
  if (!transaction.refundHistory) {
    transaction.refundHistory = [];
  }
  transaction.refundHistory.push({
    action: "Refund confirmed by Paystack webhook",
    performedBy:
      transaction.refundDetails?.processedBy ||
      new Schema.Types.ObjectId(transaction.userId),
    performedAt: new Date(),
    notes: `Paystack refund ID: ${refundId}`,
  });

  await transaction.save();

  // Update related order status
  const orderId = transaction.referenceId?.split("_")[1];
  if (orderId) {
    const order = await Order.findById(orderId);
    if (order) {
      order.status = "refunded";
      await order.save();

      // Restore product quantities
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: item.quantity },
        });
      }
    }
  }

  // Send final confirmation notification
  const user = await User.findById(transaction.userId).select("email fullName");
  if (user) {
    const notificationData: CreateNotificationData = {
      recipient: user._id as string,
      recipientModel: "User" as const,
      body: `Your refund of ₦${transaction.refundDetails.refundAmount} has been successfully processed.`,
      type: "refund",
      title: "Refund Processed",
    };

    await Promise.allSettled([
      createNotification(notificationData),
      sendEmail(
        user.email!,
        "Refund Processed Successfully",
        `Your refund of ₦${transaction.refundDetails.refundAmount} for transaction ${transaction._id} has been successfully processed. Refund ID: ${refundId}`
      ),
    ]);
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
    const deductBalance = (user.accountDetail.balance -= amount);

    user.accountDetail = {
      balance: deductBalance,
      pendingBalance: user.accountDetail.pendingBalance,
      accountName: user.accountDetail.accountName,
      accountNumber: encryptData(accountDetail.accountNumber),
      bankCode: encryptData(accountDetail.bankCode),
      bankName: encryptData(accountDetail.bankName),
      recipientCode: encryptData(recipientCode),
    };

    await user.save();

    const bodyMsg = `You have successfully withdrawn NGN ${amount}. Reference: ${reference}`;

    const notificationData: CreateNotificationData = {
      recipient: user._id as string,
      recipientModel: "User" as const,
      body: bodyMsg,
      type: "account",
      title: "Wallet Withdrawal",
    };

    // Notify user via email & in-app
    Promise.allSettled([
      sendEmail(user.email, "Withdrawal Successful", bodyMsg),
      createNotification(notificationData),
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
