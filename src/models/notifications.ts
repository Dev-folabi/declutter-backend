// import mongoose, { Schema } from "mongoose";
// import { isEmail } from "validator";
import { IUser, NotificationType } from "../types/model";


import { Schema, model } from "mongoose";

const NotificationSchema = new Schema<NotificationType>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "account",
        "market",
        "promotion"
      ],
      required: false
    },
    title: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);


export const Notification = model<NotificationType>("Notification", NotificationSchema);
