import { IUser, IAdmin, NotificationType } from "../types/model";

import { Schema, model } from "mongoose";

const NotificationSchema = new Schema<NotificationType>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "recipientModel",
    },
    recipientModel: {
      type: String,
      required: true,
      enum: ["User", "Admin"],
    },
    body: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["account", "market", "promotion", "refund"],
      required: false,
    },
    title: {
      type: String,
      required: true,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Notification = model<NotificationType>(
  "Notification",
  NotificationSchema
);
