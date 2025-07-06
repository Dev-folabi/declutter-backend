import { IWeListened } from "../types/model";
import { Schema, model } from "mongoose";


const WeListenedModel = new Schema<IWeListened>(
  {
    name: {
      type: String,
      required: true,
    },
    school: {
      type: String,
      required: true,
    },
    statement: {
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