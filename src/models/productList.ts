import { ProductListingType } from '../types/model';

import { Schema, model } from 'mongoose';

const ProductListSchema = new Schema<ProductListingType>(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    productId: {
      type: String,
      required: true,
    },
    productImage: [{ type: String, required: true }],
    productVideos: [{type: String}],
    category: {
      type: Schema.Types.ObjectId, ref: "Category", required: true
    },
    location: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    description: {
      type: String,
      required: true,
    },
    productType: {
      type: String,
      enum: ['new', 'used'],
      required: true,
      default: 'used',
    },
    is_approved: {
      type: Boolean,
      default: false,
    },
    rejection_reason: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "flagged", "removed"],
      default: "pending",
    },
    flags: {
      type: [
        {
          reason: String,
          flaggedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
          date: { type: Date, default: Date.now },
        }
      ],
      default: [],
    },
  
    is_reserved: {
      type: Boolean,
      default: false,
    },
    reserved_at: {
      type: Date,
    },
    hasSettled: {
      type: Boolean,
      default: false,
    },
    sellerPhoneNumber: {
      type: String,
      required: true,
      trim: true
    },
  },
  { timestamps: true }
);

export const Product = model<ProductListingType>('Product', ProductListSchema);
