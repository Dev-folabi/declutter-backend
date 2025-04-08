// import mongoose, { Schema } from "mongoose";
// import { isEmail } from "validator";
import { ProductListingType } from "../types/model";


import { Schema, model } from "mongoose";

const ProductListSchema = new Schema<ProductListingType>(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    productId:{
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "electronics",
        "books & stationery",
        "clothing & accessories",
        "furniture",
        "home & kitchen",
        "sports & fitness equipment",
        "gaming & entertainment",
        "health & personal care",
        "hobbies & crafts",
        "miscellaneous"
      ],
      required: true
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
    is_sold: {
      type: Boolean,
      default: false,
    },
    is_reserved: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);


export const Product = model<ProductListingType>("Product", ProductListSchema);
