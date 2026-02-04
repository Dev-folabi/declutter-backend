import { NextFunction, Request, Response } from "express";
import { Waitlist } from "../models/waitlist";
import { sendBulkEmailBCC, sendEmail } from "../utils/mail";

export const collectWaitlistEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body;

    res.status(400).json({ message: "Email added to the waitlist 🎉" });
    return;

    // Check if the email already exists in the waitlist
    const existingEmail = await Waitlist.findOne({ email });
    if (existingEmail) {
      res.status(400).json({ message: "Email already waitlisted, thanks! 🎉" });
      return;
    }

    // Create a new entry in the waitlist
    const result = await Waitlist.create({ email });
    if (!result) {
      res
        .status(400)
        .json({ message: "Unable to add email, please try again" });
      return;
    }
    const address = await Waitlist.countDocuments();
    await sendEmail(
      process.env.EMAIL_USER!,
      "New User Added to Waitlist",
      `
        <div class="header">
          🎉 New User Added to Waitlist!
        </div>
        <div class="content">
          <p>Dear Declutter Admin,</p>
          <p>Great news! A new user has joined the waitlist for the amazing product you're building.</p>
          <p><strong>Total Email Addresses on the Waitlist:</strong> ${address}</p>
          <br />
          <p>Happy Building!!!</p>
        </div>
        <br />
      `,
    );

    // Respond with success
    res.status(200).json({ message: "Email added to the waitlist 🎉" });
  } catch (error) {
    console.error("Error adding email to waitlist:", error);
    next(error);
  }
};

export const bulkCreateWaitlistEmails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { emails } = req.body;

    // Validate input
    if (!Array.isArray(emails) || emails.length === 0) {
      res.status(400).json({
        message: "Please provide a non-empty array of email addresses.",
      });
      return;
    }

    // Filter valid emails (must contain @)
    const validEmails = emails
      .filter(
        (email) => email && typeof email === "string" && email.includes("@"),
      )
      .map((email) => email.trim().toLowerCase());

    if (validEmails.length === 0) {
      res.status(400).json({
        message: "No valid email addresses found in the provided array.",
      });
      return;
    }

    // Remove duplicates within the array itself
    const uniqueEmails = Array.from(new Set(validEmails));

    // Check which emails already exist in the waitlist
    const existingWaitlistEntries = await Waitlist.find({
      email: { $in: uniqueEmails },
    }).select("email");

    const existingEmails = new Set(
      existingWaitlistEntries.map((entry) => entry.email),
    );

    // Filter out emails that already exist
    const newEmails = uniqueEmails.filter(
      (email) => !existingEmails.has(email),
    );

    if (newEmails.length === 0) {
      res.status(200).json({
        message: "All provided emails already exist in the waitlist.",
        data: {
          totalProvided: emails.length,
          validEmails: validEmails.length,
          uniqueEmails: uniqueEmails.length,
          alreadyExists: existingEmails.size,
          newlyAdded: 0,
        },
      });
      return;
    }

    // Bulk create new waitlist entries
    const waitlistEntries = newEmails.map((email) => ({ email }));
    const createdEntries = await Waitlist.insertMany(waitlistEntries, {
      ordered: false,
    });

    // Get total count after insertion
    const totalAddresses = await Waitlist.countDocuments();

    // Respond with success
    res.status(200).json({
      message: `Successfully added ${createdEntries.length} email(s) to the waitlist 🎉`,
      data: {
        totalProvided: emails.length,
        validEmails: validEmails.length,
        uniqueEmails: uniqueEmails.length,
        alreadyExists: existingEmails.size,
        newlyAdded: createdEntries.length,
        totalWaitlistCount: totalAddresses,
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      const totalCount = await Waitlist.countDocuments();
      res.status(200).json({
        message:
          "Some emails were added, but some duplicates were encountered.",
        data: {
          totalWaitlistCount: totalCount,
        },
      });
      return;
    }
    console.error("Error bulk adding emails to waitlist:", error);
    next(error);
  }
};

export const sendWaitlistMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get all waitlist emails
    const waitlistEmails = await Waitlist.find().select("email");
    // const waitlistEmails = [{ email: "Declutter@gmail.com" }];

    // Send bulk mail
    await sendBulkEmailBCC(
      waitlistEmails.map((email) => email.email),
      "🌟 Hello November, Hello New Deals! | Exciting News for You, DeclutStars 💥",
      `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Happy New Month from Declutter!</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            padding: 20px;
            line-height: 1.6;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
            padding: 45px 30px;
            text-align: center;
            color: white;
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
            background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
            animation: pulse 3s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.3; }
        }
        
        .header-content {
            position: relative;
            z-index: 1;
        }
        
        .month-icon {
            font-size: 50px;
            margin-bottom: 15px;
            animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            font-size: 18px;
            opacity: 0.95;
            font-weight: 500;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 20px;
            color: #FF6B35;
            font-weight: 600;
            margin-bottom: 20px;
        }
        
        .main-text {
            color: #333;
            font-size: 16px;
            margin-bottom: 20px;
            line-height: 1.8;
        }
        
        .main-text strong {
            color: #2C3E50;
        }
        
        .announcement-box {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
            color: white;
            text-align: center;
            box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);
        }
        
        .announcement-badge {
            background: white;
            color: #4CAF50;
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 700;
            display: inline-block;
            margin-bottom: 15px;
        }
        
        .announcement-box h2 {
            font-size: 24px;
            margin-bottom: 15px;
            font-weight: 700;
        }
        
        .announcement-box p {
            font-size: 16px;
            opacity: 0.95;
            line-height: 1.7;
        }
        
        .features-grid {
            display: flex;
            gap: 15px;
            margin: 25px 0;
            flex-wrap: wrap;
        }
        
        .feature-card {
            flex: 1;
            min-width: 140px;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            padding: 20px;
            border-radius: 10px;
            border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        .feature-icon {
            font-size: 36px;
            margin-bottom: 10px;
        }
        
        .feature-text {
            font-size: 15px;
            font-weight: 600;
        }
        
        .action-list {
            background: #FFF5F0;
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
            border: 2px solid #FFE5D9;
        }
        
        .action-list h3 {
            color: #2C3E50;
            font-size: 20px;
            margin-bottom: 25px;
            text-align: center;
            font-weight: 700;
        }
        
        .action-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 18px;
            padding: 18px;
            background: white;
            border-radius: 10px;
            border-left: 4px solid #FF6B35;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .action-item:hover {
            transform: translateX(8px);
            box-shadow: 0 4px 15px rgba(255, 107, 53, 0.15);
        }
        
        .action-item:last-child {
            margin-bottom: 0;
        }
        
        .action-icon {
            font-size: 24px;
            margin-right: 15px;
            flex-shrink: 0;
        }
        
        .action-content {
            flex: 1;
        }
        
        .action-title {
            color: #2C3E50;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 5px;
        }
        
        .action-description {
            color: #666;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .cta-section {
            background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
            border-radius: 12px;
            padding: 35px 30px;
            margin: 30px 0;
            text-align: center;
            color: white;
            box-shadow: 0 8px 25px rgba(255, 107, 53, 0.3);
        }
        
        .cta-section h2 {
            font-size: 24px;
            margin-bottom: 20px;
            font-weight: 700;
        }
        
        .website-button {
            display: inline-block;
            background: white;
            color: #FF6B35;
            padding: 18px 45px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 700;
            font-size: 18px;
            margin-top: 15px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
        }
        
        .website-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }
        
        .closing {
            text-align: center;
            margin: 35px 0 25px;
            padding: 30px;
            background: linear-gradient(135deg, #FFF5F0 0%, #FFE5D9 100%);
            border-radius: 12px;
        }
        
        .closing-main {
            font-size: 20px;
            color: #FF6B35;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .closing-sub {
            font-size: 16px;
            color: #2C3E50;
            font-weight: 500;
        }
        
        .sparkle {
            display: inline-block;
            animation: sparkle 1.5s ease-in-out infinite;
        }
        
        @keyframes sparkle {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.2); }
        }
        
        .signature {
            margin-top: 35px;
            padding-top: 25px;
            border-top: 2px solid #FFE5D9;
        }
        
        .signature p {
            color: #666;
            font-size: 15px;
            margin: 5px 0;
        }
        
        .signature .regards {
            color: #2C3E50;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .signature .team {
            color: #FF6B35;
            font-weight: 700;
            font-size: 17px;
            margin-bottom: 10px;
        }
        
        .signature .tagline {
            color: #666;
            font-style: italic;
            font-size: 14px;
        }
        
        .footer {
            background: #2C3E50;
            padding: 30px 25px;
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
        
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            
            .header {
                padding: 35px 20px;
            }
            
            .header h1 {
                font-size: 26px;
            }
            
            .header p {
                font-size: 16px;
            }
            
            .month-icon {
                font-size: 40px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .announcement-box, .action-list, .cta-section, .closing {
                padding: 25px 20px;
            }
            
            .announcement-box h2, .cta-section h2 {
                font-size: 20px;
            }
            
            .features-grid {
                flex-direction: column;
                gap: 12px;
            }
            
            .feature-card {
                min-width: 100%;
                width: 100%;
            }
            
            .action-item {
                padding: 15px;
            }
            
            .website-button {
                display: block;
                width: 100%;
                padding: 16px 20px;
                font-size: 16px;
            }
            
            .closing-main {
                font-size: 18px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="header-content">
                <div class="month-icon">🍂</div>
                <h1>Happy November!</h1>
                <p>Welcome to a brand new month</p>
            </div>
        </div>
        
        <div class="content">
            <p class="greeting">Hey DeclutStar! ✨</p>
            
            <p class="main-text">
                Welcome to a brand new month — <strong>November!</strong> 🧡
            </p>
            
            <p class="main-text">
                It's another chance to declutter, shop smart, and make some cool cash while doing it!
            </p>
            
            <div class="announcement-box">
                <div class="announcement-badge">🎉 BIG NEWS</div>
                <h2>Declutter Now Accepts New & Preloved Items!</h2>
                <p>
                    Whether you're looking to sell that item you no longer use or shop something fresh and affordable, 
                    we've got you covered. 🛍️
                </p>
                
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">✨</div>
                        <div class="feature-text">New Items</div>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">💚</div>
                        <div class="feature-text">Preloved Items</div>
                    </div>
                </div>
            </div>
            
            <div class="action-list">
                <h3>Make the Most of This Month:</h3>
                
                <div class="action-item">
                    <div class="action-icon">💫</div>
                    <div class="action-content">
                        <div class="action-title">List Your Items</div>
                        <div class="action-description">Snap it, upload it, and get ready to sell.</div>
                    </div>
                </div>
                
                <div class="action-item">
                    <div class="action-icon">💫</div>
                    <div class="action-content">
                        <div class="action-title">Shop Amazing Deals</div>
                        <div class="action-description">Discover quality items at budget-friendly prices.</div>
                    </div>
                </div>
                
                <div class="action-item">
                    <div class="action-icon">💫</div>
                    <div class="action-content">
                        <div class="action-title">Spread the Word</div>
                        <div class="action-description">Invite your friends to join the DeclutStar community. The more, the merrier!</div>
                    </div>
                </div>
            </div>
            
            <p class="main-text" style="text-align: center; font-size: 18px; font-weight: 600; color: #2C3E50;">
                Let's make November a month of smart spending and easy earning.
            </p>
            
            <div class="cta-section">
                <h2>Ready to List or Shop? 🚀</h2>
                <a href="https://www.Declutter.com" class="website-button">
                    Visit Declutter Now
                </a>
            </div>
            
            <div class="closing">
                <p class="closing-main">Happy New Month, DeclutStar! 🌸</p>
                <p class="closing-sub">Keep decluttering, keep shining. <span class="sparkle">✨</span></p>
            </div>
            
            <div class="signature">
                <p class="regards">Warm regards,</p>
                <p class="team">The Declutter Team</p>
                <p class="tagline">Declutter with Ease, Shop Affordably</p>
            </div>
        </div>
        
        <div class="footer">
            <p class="copyright">© 2024 Declutter. All rights reserved.</p>
            <p style="margin-top: 10px;">You're receiving this email because you're part of our community.</p>
        </div>
    </div>
</body>
</html>`,
    );

    // Respond with success
    res.status(200).json({ message: "Message sent to all waitlist emails" });
  } catch (error) {
    console.error("Error sending message to waitlist emails:", error);
    next(error);
  }
};

export const getWaitlistEmails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get all waitlist emails
    const waitlistEmails = await Waitlist.find().select("email -_id");

    // Respond with the waitlist emails
    res.status(200).json(waitlistEmails);
  } catch (error) {
    console.error("Error fetching waitlist emails:", error);
    next(error);
  }
};
