import { IUser, IAdmin, NotificationType } from "../types/model";


import { Schema, model } from "mongoose";

const NotificationSchema = new Schema<NotificationType>(
  {
    // user: {
    //   type: Schema.Types.ObjectId,
    //   ref: "User", 
    //   required: true,
    // },
      recipient: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: "recipientModel", // dynamically resolves to 'User' or 'Admin'
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
      enum: [
        "account",
        "market",
        "promotion",
        "refund",
      ],
      required: false
    },
    title: {
      type: String,
      required: true,
    },
    is_read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);


export const Notification = model<NotificationType>("Notification", NotificationSchema);
