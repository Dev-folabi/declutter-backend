import OTPVerification from "../models/OTPVerifivation";
import { IUser } from "../types/model";
import { IAdmin } from "../types/model";
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

interface AccountDetail {
  accountNumber?: string;
  bankCode?: string;
  bankName?: string;
  recipientCode?: string;
  // Add other properties as needed
}

export const decryptAccountDetail = (accountDetail: AccountDetail ) => {
  if (!accountDetail) return;

  accountDetail.accountNumber = accountDetail.accountNumber ? decryptData(accountDetail.accountNumber) : accountDetail.accountNumber;
  accountDetail.bankCode = accountDetail.bankCode ? decryptData(accountDetail.bankCode) : accountDetail.bankCode;
  accountDetail.bankName = accountDetail.bankName ? decryptData(accountDetail.bankName) : accountDetail.bankName;
  accountDetail.recipientCode = accountDetail.recipientCode ? decryptData(accountDetail.recipientCode) : accountDetail.recipientCode;

  // accountName is just the user name
  return accountDetail; // Return the modified object
};

// export const requestOTP = async(
//   user: IUser,
//   admin: IAdmin,
//   reason: String
// ) => {
//   const OTP = generateOTP();
//     // Upsert OTP entry
//     await OTPVerification.updateOne(
//       { user: user._id, type: "password" },
//       {admin: admin._id, type: "activate account"},
//       {
//         user: user._id,
//         OTP,
//         type: "activate account",
//         verificationType: "email",
//       },
//       { upsert: true }
//     );


//     // Send email
//     await sendEmail(
//       user.email,
//       "Verify EMail - OTP Verification",
//       `
//         Hi ${user?.fullName.split(" ")[0] || "User"},
//         <p>You recently requested to ${reason}. Use the OTP below:</p>
//         <h2>${OTP}</h2>
//         <p>This OTP is valid for <strong>30 minutes</strong>.</p>
//         <p>If you didn't request this, you can safely ignore this email.</p>
//         <br />
//       `
//     );
// }
export const requestOTP = async (
  user: IUser | null,
  admin: IAdmin | null,
  reason: string
) => {
  const OTP = generateOTP();

  const filter: any = {
    type: "activate account",
    verificationType: "email",
  };

  if (user) filter.user = user._id;
  if (admin) filter.admin = admin._id;

  const update = {
    $set: {
      OTP,
      type: "activate account",
      verificationType: "email",
      ...(user && { user: user._id }),
      ...(admin && { admin: admin._id }),
    },
  };

  await OTPVerification.updateOne(filter, update, { upsert: true });


  // Choose correct recipient
  const recipient = user || admin;
  const recipientEmail = recipient?.email;
  const recipientName = recipient?.fullName?.split(" ")[0] || "User";

  if (!recipientEmail) {
    throw new Error("No recipient email found for OTP.");
  }
// Send email
await sendEmail(
  recipientEmail,
  "Verify EMail - OTP Verification",
  `
    Hi ${recipientName},
    <p>You recently requested to ${reason}. Use the OTP below:</p>
    <h2>${OTP}</h2>
    <p>This OTP is valid for <strong>30 minutes</strong>.</p>
    <p>If you didn't request this, you can safely ignore this email.</p>
    <br />
  `
);

};


