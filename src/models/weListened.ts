import { IWeListened } from "../types/model";
import { Schema, model } from "mongoose";


const WeListenedModel = new Schema<IWeListened>(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const WeListened = model<IWeListened>("WeListened", WeListenedModel);