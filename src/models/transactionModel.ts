import mongoose, { Schema } from "mongoose";
import { ITransaction } from "../types/model";

const TransactionSchema: Schema = new Schema<ITransaction>(
  {
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    transactionDate: { type: Date, default: Date.now },
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed", "refund", "refunded", "cancelled"],
      default: "pending",
    },
    charges: { type: Number, min: 0 },
    transactionType: {
      type: String,
      required: true,
      enum: ["credit", "debit"],
    },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    description: { type: String },
    referenceId: { type: String, unique: true, sparse: true },
    refundRequest: {
      reason: { type: String },
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      requestedAt: { type: Date },
      adminNotes: { type: String },
    },
    refundStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "processed"],
      default: null,
    },
    refundDetails: {
      paystackRefundId: { type: String },
      refundAmount: { type: Number },
      processedAt: { type: Date },
      processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    },
    refundHistory: [
      {
        action: { type: String, required: true },
        performedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
        performedAt: { type: Date, default: Date.now },
        notes: { type: String },
      },
    ],
    totalAmount: { type: Number, default: 0 },
    sellerEarnings: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    dispute: { type: Boolean, default: false },
    expiresAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

TransactionSchema.index({ userId: 1, transactionDate: -1 });

export const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema
);
