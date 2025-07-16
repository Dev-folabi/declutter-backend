import { Schema, model } from "mongoose";
import { OTPVerificationModelType } from "../types/model";

const OTPVerify = new Schema<OTPVerificationModelType>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admin: { type: Schema.Types.ObjectId, ref: "Admin", required: true }, 
    OTP: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "password",
        "transaction pin",
        "activate account"
      ],
      default: "password",
    },
    verificationType: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

OTPVerify.index({ updatedAt: 1 }, { expireAfterSeconds: 1800 });

OTPVerify.index({ user: 1, type: 1 }, { unique: true });

const OTPVerification = model("OTPVerification", OTPVerify);

export default OTPVerification;
