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
      type: String,
      enum: [
        'electronics',
        'books & stationery',
        'clothing & accessories',
        'furniture',
        'home & kitchen',
        'sports & fitness equipment',
        'gaming & entertainment',
        'health & personal care',
        'hobbies & crafts',
        'miscellaneous',
      ],
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
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
  
    is_sold: {
      type: Boolean,
      default: false,
    },
    is_reserved: {
      type: Boolean,
      default: false,
    },
    hasSettled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Product = model<ProductListingType>('Product', ProductListSchema);
