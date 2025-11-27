import mongoose from "mongoose";
import { User } from "../src/models/userModel";
import { generateReferralCode } from "../src/utils/generateReferralCode";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Script to generate referral codes for existing users who don't have one
 * This script can be run independently to backfill referral codes
 */
async function generateReferralCodesForExistingUsers() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✓ Connected to MongoDB successfully\n");

    // Find all users without a referral code
    console.log("Finding users without referral codes...");
    const usersWithoutReferralCode = await User.find({
      $or: [
        { referralCode: { $exists: false } },
        { referralCode: null },
        { referralCode: "" },
      ],
    });

    console.log(
      `Found ${usersWithoutReferralCode.length} users without referral codes\n`
    );

    if (usersWithoutReferralCode.length === 0) {
      console.log("✓ All users already have referral codes!");
      await mongoose.disconnect();
      return;
    }

    // Generate and assign referral codes
    let successCount = 0;
    let errorCount = 0;

    console.log("Generating referral codes...\n");

    for (const user of usersWithoutReferralCode) {
      try {
        // Generate a unique referral code
        const referralCode = await generateReferralCode();

        // Update the user with the new referral code
        await User.findByIdAndUpdate(user._id, { referralCode });

        successCount++;
        console.log(
          `✓ [${successCount}/${usersWithoutReferralCode.length}] Generated code for user: ${user.email} -> ${referralCode}`
        );
      } catch (error) {
        errorCount++;
        console.error(
          `✗ Error generating code for user ${user.email}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total users processed: ${usersWithoutReferralCode.length}`);
    console.log(`Successfully generated: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log("=".repeat(60) + "\n");

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB");
  } catch (error) {
    console.error("Fatal error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
generateReferralCodesForExistingUsers()
  .then(() => {
    console.log("\n✓ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Script failed:", error);
    process.exit(1);
  });
