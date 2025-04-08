import { Schema, model } from "mongoose";
import { ContactUsModelType } from "../types/model";

const ContactUsSchema = new Schema<ContactUsModelType>(
  {
        body: {
          type: String,
          required: true,
        },
        fullName: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        issue: {
          type: String,
          enum: ["account", "payment", "order", "others"],
          required: true,
        },
        is_closed: {
          type: Boolean,
          default: false,
        },
  },
  { timestamps: true }
);


export const ContactUs = model<ContactUsModelType>("ContactUs", ContactUsSchema);
