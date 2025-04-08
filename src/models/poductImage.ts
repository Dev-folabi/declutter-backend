// import mongoose, { Schema } from "mongoose";
// import { isEmail } from "validator";
import { ProductListingImage } from "../types/model";


import { Schema, model } from "mongoose";

const ProductImageSchema = new Schema<ProductListingImage>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Prodct",
      required: true,
    },
    image_url: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);


export const ProductImage = model<ProductListingImage>("ProductImage", ProductImageSchema);
