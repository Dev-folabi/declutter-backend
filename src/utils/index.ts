import OTPVerification from "../models/OTPVerifivation";
import { IUser } from "../types/model";
import { sendEmail } from "./mail";
import dotenv from "dotenv";

import crypto from 'crypto';

dotenv.config();
export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return otp;
}

const algorithm = 'aes-256-cbc';
const secretKey = process.env.SECRET_KEY || ''; // 32-byte key
const iv = crypto.randomBytes(16);

// Encrypt Function
export function encryptData(data : any) {
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
    let encrypted = cipher.update(data, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

// Decrypt Function
export function decryptData(encryptedData : any) {
    console.log(encryptData);
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
}

export const decryptAccountDetail = (accountDetail: any) => {
  if (!accountDetail) return;

  if (accountDetail.accountNumber !== undefined) {
    accountDetail.accountNumber = decryptData(accountDetail.accountNumber);
  }

  if (accountDetail.bankCode !== undefined) {
    accountDetail.bankCode = decryptData(accountDetail.bankCode);
  }

  if (accountDetail.bankName !== undefined) {
    accountDetail.bankName = decryptData(accountDetail.bankName);
  }

  if (accountDetail.recipientCode !== undefined) {
    accountDetail.recipientCode = decryptData(accountDetail.recipientCode);
  }

  // accountName is just the user name
};

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

