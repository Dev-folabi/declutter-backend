import dotenv from "dotenv";
import mongoose from "mongoose";
import { Waitlist } from "../models/waitlist";
import connectDB from "../db";
import { sendEmail } from "../utils/mail";

// Load environment variables
dotenv.config();

/**
 * Script to bulk create waitlist emails from an array
 *
 * Usage:
 *   ts-node src/scripts/bulkCreateWaitlist.ts
 *
 * Modify the emails array below with your email addresses
 */

// Array of emails to add to waitlist

const emailsToAdd = [""];

async function bulkCreateWaitlistEmails() {
  try {
    // Connect to database
    await connectDB();
    console.log("Connected to database");

    // Filter valid emails (must contain @)
    const validEmails = emailsToAdd
      .filter(
        (email) => email && typeof email === "string" && email.includes("@")
      )
      .map((email) => email.trim().toLowerCase());

    if (validEmails.length === 0) {
      console.error("No valid email addresses found in the provided array.");
      process.exit(1);
    }

    console.log(`\nProcessing ${validEmails.length} valid email(s)...`);

    // Remove duplicates within the array itself
    const uniqueEmails = Array.from(new Set(validEmails));
    console.log(
      `After removing duplicates: ${uniqueEmails.length} unique email(s)`
    );

    // Check which emails already exist in the waitlist
    const existingWaitlistEntries = await Waitlist.find({
      email: { $in: uniqueEmails },
    }).select("email");

    const existingEmails = new Set(
      existingWaitlistEntries.map((entry) => entry.email)
    );

    console.log(`Already in waitlist: ${existingEmails.size} email(s)`);

    // Filter out emails that already exist
    const newEmails = uniqueEmails.filter(
      (email) => !existingEmails.has(email)
    );

    if (newEmails.length === 0) {
      console.log("\n✓ All provided emails already exist in the waitlist.");
      console.log(`Total waitlist count: ${await Waitlist.countDocuments()}`);
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`New emails to add: ${newEmails.length} email(s)\n`);

    // Bulk create new waitlist entries
    const waitlistEntries = newEmails.map((email) => ({ email }));
    const createdEntries = await Waitlist.insertMany(waitlistEntries, {
      ordered: false,
    });

    // Get total count after insertion
    const totalAddresses = await Waitlist.countDocuments();

    console.log(
      `\n✓ Successfully added ${createdEntries.length} email(s) to the waitlist!`
    );
    console.log(`Total waitlist count: ${totalAddresses}`);

    // Summary
    console.log("\n--- Summary ---");
    console.log(`Total provided: ${emailsToAdd.length}`);
    console.log(`Valid emails: ${validEmails.length}`);
    console.log(`Unique emails: ${uniqueEmails.length}`);
    console.log(`Already existed: ${existingEmails.size}`);
    console.log(`Newly added: ${createdEntries.length}`);
    console.log(`Total waitlist count: ${totalAddresses}`);

    // Close database connection
    await mongoose.connection.close();
    console.log("\n✓ Database connection closed");
    process.exit(0);
  } catch (error: any) {
    // Handle duplicate key errors (in case of race conditions)
    if (error.code === 11000) {
      console.log(
        "⚠ Some emails were added, but some duplicates were encountered."
      );
      const totalCount = await Waitlist.countDocuments();
      console.log(`Total waitlist count: ${totalCount}`);
    } else {
      console.error("Error bulk adding emails to waitlist:", error);
    }
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
bulkCreateWaitlistEmails();
