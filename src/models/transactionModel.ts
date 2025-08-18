import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  userId: string;
  amount: number;
  transactionDate: Date;
  status: string;
  charges?: number;
  transactionType: string;
  description?: string;
  referenceId?: string;
  refundRequest?: {
    reason: string;
    requestedBy: Schema.Types.ObjectId;
    requestedAt: Date;
    adminNotes?: string;
  };
  refundStatus?: "pending" | "approved" | "rejected" | "processed";
  refundDetails?: {
    paystackRefundId?: string;
    refundAmount?: number;
    processedAt?: Date;
    processedBy?: Schema.Types.ObjectId;
  };
  refundHistory?: Array<{
    action: string;
    performedBy: Schema.Types.ObjectId;
    performedAt: Date;
    notes?: string;
  }>;
  dispute?: boolean;
  platformCommission: number;
  sellerEarnings: number;
  netRevenue: number;

  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema<ITransaction>(
  {
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    transactionDate: { type: Date, default: Date.now },
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed", "refund", "refunded"],
      default: "pending",
    },
    charges: { type: Number, min: 0 },
    transactionType: {
      type: String,
      required: true,
      enum: ["credit", "debit"],
    },
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
    refundHistory: [{
      action: { type: String, required: true },
      performedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
      performedAt: { type: Date, default: Date.now },
      notes: { type: String },
    }],
    platformCommission: { type: Number, required: true },
    sellerEarnings: { type: Number, required: true },
    netRevenue: { type: Number, required: true },
    dispute: { type: Boolean, default: false },
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
