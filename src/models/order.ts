import mongoose, { Schema, Document } from "mongoose";
import { IOrder, IOrderItem } from "../types/model";

// Schema for OrderItem
const OrderItemSchema: Schema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

// Schema for Order
const OrderSchema: Schema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [OrderItemSchema],
    totalPrice: { type: Number, required: false, min: 0 },
  status: { 
    type: String, 
    required: true, 
    enum: ["pending", "paid", "failed", "refunded"], 
    default: "pending" 
  },
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
