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
  process.env.BREVO_API_KEY as string,
);

// Helper: generate styled HTML
const generateEmailHTML = (text: string): string => {
  const currentYear = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Declutter</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
          margin: 0;
          padding: 20px;
          line-height: 1.6;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }
        
        .header {
          background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
          padding: 30px 20px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        }
        
        .header img {
          max-width: 150px;
          height: auto;
          position: relative;
          z-index: 1;
          filter: brightness(0) invert(1);
        }
        
        .content-wrapper {
          padding: 40px 30px;
        }
        
        .content {
          font-size: 16px;
          line-height: 1.8;
          color: #333;
          margin-bottom: 30px;
        }
        
        .content p {
          margin-bottom: 16px;
        }
        
        .content strong {
          color: #2C3E50;
          font-weight: 600;
        }
        
        .content a {
          color: #FF6B35;
          text-decoration: none;
          font-weight: 500;
          border-bottom: 2px solid transparent;
          transition: border-color 0.3s ease;
        }
        
        .content a:hover {
          border-bottom-color: #FF6B35;
        }
        
        .signature {
          margin-top: 35px;
          padding-top: 25px;
          border-top: 2px solid #FFE5D9;
        }
        
        .signature p {
          margin: 8px 0;
          color: #666;
          font-size: 15px;
        }
        
        .signature .team-name {
          color: #FF6B35;
          font-weight: 700;
          font-size: 17px;
          margin-top: 5px;
        }
        
        .footer {
          background: #2C3E50;
          padding: 25px 20px;
          text-align: center;
          color: #fff;
        }
        
        .footer p {
          font-size: 13px;
          opacity: 0.8;
          margin: 5px 0;
        }
        
        .footer .copyright {
          font-weight: 600;
          opacity: 1;
          font-size: 14px;
        }
        
        .divider {
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, #FF6B35 0%, #FF8C42 100%);
          margin: 20px auto;
          border-radius: 2px;
        }
        
        @media only screen and (max-width: 600px) {
          body {
            padding: 10px;
          }
          
          .content-wrapper {
            padding: 30px 20px;
          }
          
          .header {
            padding: 25px 15px;
          }
          
          .header img {
            max-width: 120px;
          }
          
          .content {
            font-size: 15px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <img src="${process.env.Declutter_LOGO}" alt="Declutter" />
        </div>
        
        <div class="content-wrapper">
          <div class="divider"></div>
          
          <div class="content">
            ${text.replace(/\./g, ".<br />")}
          </div>
          
          <div class="signature">
            <p>Happy decluttering,</p>
            <p class="team-name">Declutter Team</p>
          </div>
        </div>
        
        <div class="footer">
          <p class="copyright">&copy; ${currentYear} Declutter. All rights reserved.</p>
          <p>Helping students declutter, one item at a time.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send single email
export const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    const recipients = to.split(",").map((email) => ({ email: email.trim() }));

    const sendSmtpEmail = {
      sender: { name: "Declutter", email: process.env.EMAIL_USER as string },
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
  batchSize: number = 50,
) => {
  const batches = [];
  for (let i = 0; i < recipients.length; i += batchSize) {
    batches.push(recipients.slice(i, i + batchSize));
  }

  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const [batchIndex, batch] of batches.entries()) {
    try {
      const sendSmtpEmail = {
        sender: { name: "Declutter", email: process.env.EMAIL_USER as string },
        to: [{ email: process.env.EMAIL_USER as string }], // dummy TO (yourself)
        bcc: batch.map((email) => ({ email })), // actual recipients hidden in BCC
        subject,
        htmlContent: generateEmailHTML(text),
        // htmlContent: text,
      };

      await client.sendTransacEmail(sendSmtpEmail);
      results.success += batch.length;

      console.log(
        `✅ Batch ${batchIndex + 1}/${batches.length} sent successfully (${batch.length} recipients)`,
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
