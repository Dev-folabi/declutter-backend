import { Schema, model } from "mongoose";
import { IAnnouncement } from "../types/model/index";

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    category: {
      type: String,
      enum: ["Buyers", "Sellers", "All"],
      required: true,
    },
    createdBy: {
      id: { type: Schema.Types.ObjectId, ref: "Admin" },
    },
  },
  { timestamps: true }
);
export const Announcement = model<IAnnouncement>(
  "Announcement",
  announcementSchema
);
