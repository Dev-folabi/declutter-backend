import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const currentYear = new Date().getFullYear();

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 487,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, text: string, bcc?: string[]) => {
  const mailOptions = {
    from: `"DeclutMart" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    bcc,
    html: `
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
            <img src=${process.env.DECLUTMART_LOGO} alt="DeclutMart" />
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
    `,
  };

  if (bcc && bcc.length > 0) {
    mailOptions.to = "no-reply@declutmart.com"; 
    mailOptions.bcc = bcc;
  } else {
    mailOptions.to = to;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
  } catch (error: any) {
    console.error("Error sending email:", error.message || error);
  }
};
