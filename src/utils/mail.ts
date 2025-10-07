import dotenv from "dotenv";
import {
  TransactionalEmailsApi,
  TransactionalEmailsApiApiKeys,
} from "@getbrevo/brevo";

dotenv.config();

const currentYear = new Date().getFullYear();

// Initialize Brevo client
const client = new TransactionalEmailsApi();
client.setApiKey(
  TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY as string
);

// Helper: generate styled HTML
const generateEmailHTML = (text: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
        }
        .header img {
          max-width: 120px;
        }
        .content {
          text-align: left;
          font-size: 16px;
          line-height: 1.6;
          color: #333;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #888;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <img src="${process.env.DECLUTMART_LOGO}" alt="DeclutMart" />
        </div>
        <div class="content">
          ${text}
          <p>Thank you,</p>
          <p><strong>DeclutMart Team</strong></p>
        </div>
        <div class="footer">
          &copy; ${currentYear} DeclutMart. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send single email
export const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    const recipients = to.split(',').map(email => ({ email: email.trim() }));

    const sendSmtpEmail = {
      sender: { name: "DeclutMart", email: process.env.EMAIL_USER as string },
      to: recipients,
      subject,
      htmlContent: generateEmailHTML(text),
    };

    await client.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email sent successfully to ${to}!`);
  } catch (error: any) {
    console.error(`❌ Error sending email to ${to}:`, error.message || error);
    throw error;
  }
};

// Send bulk emails in batches (Brevo handles lists, but we keep batching logic)
export const sendBulkEmailBCC = async (
  recipients: string[],
  subject: string,
  text: string,
  batchSize: number = 50
) => {
  const batches = [];
  for (let i = 0; i < recipients.length; i += batchSize) {
    batches.push(recipients.slice(i, i + batchSize));
  }

  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const [batchIndex, batch] of batches.entries()) {
    try {
      const sendSmtpEmail = {
        sender: { name: "DeclutMart", email: process.env.EMAIL_USER as string },
        to: [{ email: process.env.EMAIL_USER as string }], // dummy TO (yourself)
        bcc: batch.map((email) => ({ email })), // actual recipients hidden in BCC
        subject,
        htmlContent: generateEmailHTML(text),
      };

      await client.sendTransacEmail(sendSmtpEmail);
      results.success += batch.length;

      console.log(
        `✅ Batch ${batchIndex + 1}/${batches.length} sent successfully (${batch.length} recipients)`
      );

      if (batchIndex < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error: any) {
      results.failed += batch.length;
      const errorMsg = `❌ Batch ${batchIndex + 1} failed: ${
        error.message || error
      }`;
      results.errors.push(errorMsg);
      console.error(errorMsg);
    }
  }

  return results;
};
