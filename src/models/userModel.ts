import mongoose, { Schema } from "mongoose";
import { isEmail } from "validator";
import { IUser } from "../types/model";

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, uppercase: true, required: true },
    email: {
      type: String,
      lowercase: true,
      unique: true,
      validate: [isEmail, "Please Enter a Valid Email"],
    },
    password: {
      type: String,
      minLength: [8, "Minimum Password length is 8"],
      required: true,
    },
    schoolId: { type: Schema.Types.ObjectId, required: true },
    schoolIdCard: { type: String },
    nin: { type: String, minlength: [8, "Input valid NIN"] },
    accountNumber: { type: String },
    bankCode: { type: String },
    accountName: { type: String },
    pin: { type: String },
    role: { type: [String], enum: ["seller", "buyer"], required: true },
    sellerStatus: {
      type: String,
      enum: ["approved", "pending", "reject"],
      default: "pending",
      required: true,
    },
    isVerified: { type: Boolean, default: false, required: true },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
