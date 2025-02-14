import OTPVerification from "../models/OTPVerifivation";
import { IUser } from "../types/model";
import { sendEmail } from "./mail";

export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return otp;
}


export const requestOTP = async(
  user: IUser,
  reason: String
) => {
  const OTP = generateOTP();
    // Upsert OTP entry
    await OTPVerification.updateOne(
      { user: user._id, type: "password" },
      {
        user: user._id,
        OTP,
        type: "activate account",
        verificationType: "email",
      },
      { upsert: true }
    );

    // Send email
    await sendEmail(
      user.email,
      "Verify EMail - OTP Verification",
      `
        Hi ${user?.fullName.split(" ")[0] || "User"},
        <p>You recently requested to ${reason}. Use the OTP below:</p>
        <h2>${OTP}</h2>
        <p>This OTP is valid for <strong>30 minutes</strong>.</p>
        <p>If you didn’t request this, you can safely ignore this email.</p>
        <br />
      `
    );
}

