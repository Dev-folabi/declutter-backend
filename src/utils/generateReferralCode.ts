import crypto from "crypto";
import { User } from "../models/userModel";

/**
 * Generates a unique 8-character alphanumeric referral code
 * Format: Uppercase letters and numbers (e.g., A7K9M2X4)
 * @returns Promise<string> - Unique referral code
 */
export async function generateReferralCode(): Promise<string> {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const codeLength = 8;
  let referralCode: string;
  let isUnique = false;

  // Keep generating until we find a unique code
  while (!isUnique) {
    referralCode = "";

    // Generate random code
    for (let i = 0; i < codeLength; i++) {
      const randomIndex = crypto.randomInt(0, characters.length);
      referralCode += characters[randomIndex];
    }

    // Check if code already exists
    const existingUser = await User.findOne({ referralCode });
    if (!existingUser) {
      isUnique = true;
      return referralCode;
    }
  }

  // This should never be reached, but TypeScript requires a return
  throw new Error("Failed to generate unique referral code");
}
