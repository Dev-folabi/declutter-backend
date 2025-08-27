import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const currentYear = new Date().getFullYear();

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

export const sendEmail = async (to: string, subject: string, text: string) => {
  const mailOptions = {
    from: `"DeclutMart" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: generateEmailHTML(text),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}!`);
  } catch (error: any) {
    console.error(`Error sending email to ${to}:`, error.message || error);
    throw error;
  }
};

// New function for bulk emails (BCC approach)
export const sendBulkEmailBCC = async (
  recipients: string[],
  subject: string,
  text: string,
  batchSize: number = 50
) => {
  const batches = [];

  // Split recipients into batches
  for (let i = 0; i < recipients.length; i += batchSize) {
    batches.push(recipients.slice(i, i + batchSize));
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const [batchIndex, batch] of batches.entries()) {
    try {
      const mailOptions = {
        from: `"DeclutMart" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        bcc: batch,
        subject,
        html: generateEmailHTML(text),
      };

      await transporter.sendMail(mailOptions);
      results.success += batch.length;
      console.log(
        `Batch ${batchIndex + 1}/${batches.length} sent successfully (${batch.length} recipients)`
      );

      // Add delay between batches to avoid rate limiting
      if (batchIndex < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error: any) {
      results.failed += batch.length;
      const errorMsg = `Batch ${batchIndex + 1} failed: ${error.message || error}`;
      results.errors.push(errorMsg);
      console.error(errorMsg);
    }
  }

  return results;
};

// Helper function to generate email HTML (extracted for reusability)
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
