import { sendEmail } from "../utils/mail";
import dotenv from "dotenv";

dotenv.config();

const main = async () => {
  const args = process.argv.slice(2);
  const recipient = args[0];

  if (!recipient) {
    console.error("Please provide a recipient email address.");
    console.error(
      "Usage: npx ts-node src/scripts/testEmail.ts <recipient_email>",
    );
    process.exit(1);
  }

  console.log(`Sending test email to ${recipient}...`);

  try {
    await sendEmail(
      recipient,
      "Test Email from Declutter",
      "<p>This is a test email to verify the email sending functionality. Have a nice day!</p>",
    );
    console.log("Test email sent successfully.");
  } catch (error) {
    console.error("Failed to send test email:", error);
    process.exit(1);
  }
};

main();
