import { IInvoice } from "../types/model";
import { Schema, model, Mongoose } from "mongoose";
const invoiceSchema = new Schema<IInvoice>(
    {
        customInvoiceId: {type: String, unique: true, immutable: true, default: () => {
            return "INV" + Math.floor(100000 + Math.random() * 900000)}
        },
        orderId: {type: Schema.Types.ObjectId, ref: "Order", required: true},
        typeOfAssignment: {type: String, required: true, enum: ["pickup", "delivery","pickup_and_delivery"]},
        amount: {type: Number, required: true, min: 0}, 
        deliveryAddress: {type: String, },
        pickupAddress: {type: String, },
        createdBy: {type: Schema.Types.ObjectId, ref: "Admin"},
        status: {type: String,  enum: ["successfull", "pending", "failed"], default: "pending"},
    }, { timestamps: true }
);

export const Invoice = model<IInvoice>("Invoice", invoiceSchema)