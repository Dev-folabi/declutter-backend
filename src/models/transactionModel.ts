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
      enum: ["pending", "completed", "failed", "refund"],
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
