import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
    userId: string;
    amount: number;
    transactionDate: Date;
    status: string;
    transactionType: string;
    description?: string;
    referenceId?: string;
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    transactionDate: { type: Date, default: Date.now },
    status: { type: String, required: true, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    transactionType: { type: String, required: true, enum: ['credit', 'debit'] },
    description: { type: String },
    referenceId: { type: String, unique: true, sparse: true },
}, {
    timestamps: true
});

TransactionSchema.index({ userId: 1, transactionDate: -1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);