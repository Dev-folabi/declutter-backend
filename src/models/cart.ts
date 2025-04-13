import mongoose, { Schema, Document } from "mongoose";
import { ICart, ICartItem } from "../types/model";

// Schema for CartItem
const CartItemSchema: Schema = new Schema<ICartItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

// Schema for Cart
const CartSchema: Schema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [CartItemSchema],
    totalPrice: { type: Number, required: true, min: 0 },
  },
);

// Models
export const Cart = mongoose.model<ICart>("Cart", CartSchema);
