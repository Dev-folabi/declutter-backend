import { IInvoice } from "../types/model";
import { Schema, model } from "mongoose";
const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceId: { type: String, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    typeOfAssignment: {
      type: String,
      required: true,
      enum: ["pickup", "delivery", "pickup_and_delivery"],
    },
    amount: { type: Number, required: true, min: 0 },
    deliveryAddress: { type: String },
    pickupAddress: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    status: {
      type: String,
      enum: ["successfull", "pending", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Invoice = model<IInvoice>("Invoice", invoiceSchema);
