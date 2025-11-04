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

const emailsToAdd = [
    "yusufafolabi1421@gmail.com",
    "yusufafolabi95@gmail.com",
    "dharmmy621@gmail.com",
    "rabiaheniola@gmail.com",
    "kaotharjimoh2003@gmail.com",
    "abdullateefzainab123@gmail.com",
    "perekosufaobudah08@gmail.com",
    "olanijiolumide09@gmail.com",
    "sulaimanhalima215@gmail.com",
    "alabifatimoh2016@gmail.com",
    "adediransukurat4all@gmail.com",
    "olayiwolajimoh@gmail.com",
    "yusufmm13@gmail.com",
    "ayobamig295@gmail.com",
    "adedayooo.e@gmail.com",
    "alhajinurudeen82@gmail.com",
    "salaudeentajudeen09@gmail.com",
    "tfunmie08@gmail.com",
    "Odelemaridiyat2306@gmail.com",
    "olaakin722@gmail.com",
    "aderopoahmad60@gmail.com",
    "hameedahtemitayo@gmail.com",
    "fhollytechpd24@gmail.com",
    "adedoyinsanni1992@gmail.com",
    "alabibdn@gmail.com",
    "lpeculiar4@gmail.com",
    "adenijimufidah441@gmail.com",
    "yusufmahfooz@gmail.com",
    "muktarsalaudeen20@gmail.com",
    "ajoseabimbola88@gmail.com",
    "adebayosma1@gmail.com",
    "motunrayohamzat41@gmail.com",
    "sammypelumi288@gmail.com",
    "awoyemitolulope99@gmail.com",
    "sylvestershadrach24@gmail.com",
    "opticsitsolutionslimited@gmail.com",
    "adeniranatinuke7@gmail.com",
    "pipas97886@myweblaw.com",
    "abdulqadri08@gmail.com",
    "adepojuronkemercy@gmail.com",
    "abdulqadri8@gmail.com",
    "luqmanakanbi12@gmail.com",
    "bangiscoder@gmail.com",
    "babiedot@gmail.com",
    "ayubahmed3013@gmail.com",
    "omotoshoyetunde48@gmail.com",
    "usmanamonbiojo@gmail.com",
    "akeemayomide80@gmail.com",
    "rajikhadijah27@gmail.com",
    "afolabimercyv@gmail.com",
    "rubykay016@gmail.com",
    "wasiuzainab091@gmail.com",
    "goodnessadeyemo21@gmail.com",
    "nasirubaba4@gmail.com",
    "izakariyah73@gmail.com",
    "olododorabiat@gmail.com",
    "adewalesamad10@gmail.com",
    "innocentadaji0@gmail.com",
    "ajayianuoluwapoo50@gmail.com",
    "israelsamson204@gmail.com",
    "ayobadmus170@gmail.com",
    "idrakabdul4@gmail.com",
    "alobalowonafisat@gmail.com",
    "aishatilias1@gmail.com",
    "faruqolamide77@gmail.com",
    "ajokolaramat@gmail.com",
    "abdurahmonabdullah247@gmail.com",
    "taofeeqohrabbit20@gmail.com",
    "idrisabdazeem99@gmail.com",
    "oluwatosinoguntoyinboo@gmail.com",
    "nurain.saka@gmail.com",
    "umarahmed19@gmail.com",
    "ridwanadebayo358@gmail.com",
    "akinbuwaifeoluwa29@gmail.com",
    "olakale92@gmail.com",
    "asquarestyle1@gmail.com",
    "ajadimojirayo01@gmail.com",
    "abdulgafarahmadadeshina@gmail.com",
    "nasirahaweda@gmail.com",
    "samueladewoye312@gmail.com",
    "badirahwuraola@gmail.com",
    "ayoogbola@gmail.com",
    "baskeykoer@gmail.com",
    "bolajimoh2050@gmail.com",
    "odejayinifemi@gmail.com",
    "raj081081@gmail.com",
    "user@example.com",
    "declutmart.qa+0003@gmail.com",
    "declutmart.qa+311@gmail.com",
    "dcm1@yopmail.com",
    "evaldemy@gmail.com",
    "mine.nefertiti@gmail.com",
    "jimohrofat431@gmail.com",
    "sofiatoyewole586@gmail.com",
    "Kaotharjimoh2003@gmail.com",
    "abdullateefabdullahi37@gmail.com",
    "fatimaholoore@gmail.com",
    "tobechukwulawrence1@gmail.com",
    "ummulkhayrorire74@gmail.com",
    "adolf_mayer@recodz.com",
    "isobel72@hotmail.com",
    "ghowell00@yahoo.com",
    "etroxjr09@gmail.com",
    "abatoj16@gmail.com",
    "ajayia484@gmail.com",
    "dawoodislamiyyateniola@gmail.com",
    "Mustapharobiah453@gmail.com",
    "faizahadebisi@gmail.com",
    "magajibukolasalamat@gmail.com",
    "dawoodislamiyyateniola@gmail.comd",
    "mahmudmukhtar17@gmail.com",
    "abdulrasheedaliyu09@gmail.com",
    "karimatijani1510@gmail.com",
    "taofeeqahibraheem605@gmail.com",
    "divinejamed@gmail.com",
    "selfdigital01@gmail.com",
    "albymu23@gmail.com",
    "abdullahifirdaouzimam@gmail.com",
    "abdullahibabatunde644@gmail.com",
    "godsglorybrownson30@gmail.com",
    "yuangimin@gmail.com",
    "aadilnawaz658@gmail.com",
    "ewumiazeez7@gmail.com",
    "chigboann10@gmail.com",
    "Earlygo.logistics@gmail.com",
    "babemeerah@gmail.com",
    "ienacolemanmt417@gmail.com",
    "unitrocha@gmail.com"
  ]
  

async function bulkCreateWaitlistEmails() {
  try {
    // Connect to database
    await connectDB();
    console.log("Connected to database");

    // Filter valid emails (must contain @)
    const validEmails = emailsToAdd
      .filter((email) => email && typeof email === "string" && email.includes("@"))
      .map((email) => email.trim().toLowerCase());

    if (validEmails.length === 0) {
      console.error("No valid email addresses found in the provided array.");
      process.exit(1);
    }

    console.log(`\nProcessing ${validEmails.length} valid email(s)...`);

    // Remove duplicates within the array itself
    const uniqueEmails = Array.from(new Set(validEmails));
    console.log(`After removing duplicates: ${uniqueEmails.length} unique email(s)`);

    // Check which emails already exist in the waitlist
    const existingWaitlistEntries = await Waitlist.find({
      email: { $in: uniqueEmails },
    }).select("email");

    const existingEmails = new Set(
      existingWaitlistEntries.map((entry) => entry.email)
    );

    console.log(`Already in waitlist: ${existingEmails.size} email(s)`);

    // Filter out emails that already exist
    const newEmails = uniqueEmails.filter((email) => !existingEmails.has(email));

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

    console.log(`\n✓ Successfully added ${createdEntries.length} email(s) to the waitlist!`);
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
      console.log("⚠ Some emails were added, but some duplicates were encountered.");
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

