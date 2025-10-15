import { NextFunction, Request, Response } from "express";
import { Waitlist } from "../models/waitlist";
import { sendBulkEmailBCC, sendEmail } from "../utils/mail";

export const collectWaitlistEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

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
          <p>Dear DeclutMart Admin,</p>
          <p>Great news! A new user has joined the waitlist for the amazing product you're building.</p>
          <p><strong>Total Email Addresses on the Waitlist:</strong> ${address}</p>
          <br />
          <p>Happy Building!!!</p>
        </div>
        <br />
      `
    );

    // Respond with success
    res.status(200).json({ message: "Email added to the waitlist 🎉" });
  } catch (error) {
    console.error("Error adding email to waitlist:", error);
    next(error);
  }
};

export const sendWaitlistMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get all waitlist emails
    const waitlistEmails = await Waitlist.find().select("email");
    // const waitlistEmails = [{ email: "declutmart@gmail.com" }];
    // Send bulk mail
    await sendBulkEmailBCC(
      waitlistEmails.map((email) => email.email),
      "We're Launching in 24 Hours! Join Our X Space on Smart Spending",
      `
          <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>24 Hours Until DeclutMart Launches!</title>
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
            padding: 35px 30px;
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
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: pulse 3s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.3; }
        }
        
        .header h1 {
            font-size: 26px;
            margin-bottom: 8px;
            font-weight: 700;
            position: relative;
            z-index: 1;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.95;
            position: relative;
            z-index: 1;
        }
        
        .countdown-badge {
            background: white;
            color: #FF6B35;
            padding: 15px 30px;
            border-radius: 50px;
            display: inline-block;
            margin: 20px auto 0;
            font-weight: 700;
            font-size: 24px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
            position: relative;
            z-index: 1;
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
        
        .event-card {
            background: linear-gradient(135deg, #2C3E50 0%, #34495e 100%);
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
            color: white;
            box-shadow: 0 8px 25px rgba(44, 62, 80, 0.3);
        }
        
        .event-card h2 {
            font-size: 22px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .event-icon {
            font-size: 28px;
        }
        
        .event-details {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .event-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #4CAF50;
        }
        
        .event-description {
            font-size: 15px;
            opacity: 0.9;
            line-height: 1.6;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
            color: white;
            padding: 16px 35px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 700;
            font-size: 16px;
            margin-top: 15px;
            box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
            transition: all 0.3s ease;
            text-align: center;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 107, 53, 0.5);
        }
        
        .benefits-box {
            background: #FFF5F0;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
            border: 2px solid #FFE5D9;
        }
        
        .benefits-box h3 {
            color: #2C3E50;
            font-size: 18px;
            margin-bottom: 15px;
            font-weight: 600;
        }
        
        .benefit-item {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            padding: 12px;
            background: white;
            border-radius: 8px;
            border-left: 3px solid #4CAF50;
        }
        
        .benefit-item:last-child {
            margin-bottom: 0;
        }
        
        .check-icon {
            color: #4CAF50;
            font-size: 20px;
            margin-right: 12px;
            font-weight: bold;
        }
        
        .benefit-text {
            color: #333;
            font-size: 15px;
            font-weight: 500;
        }
        
        .closing {
            text-align: center;
            margin: 35px 0 25px;
            padding: 25px;
            background: linear-gradient(135deg, #FFF5F0 0%, #FFE5D9 100%);
            border-radius: 12px;
        }
        
        .closing-text {
            font-size: 18px;
            color: #2C3E50;
            font-weight: 600;
            margin-bottom: 15px;
        }
        
        .action-items {
            display: flex;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
            margin-top: 15px;
        }
        
        .action-badge {
            background: white;
            color: #FF6B35;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
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
        
        .signature .excitement {
            font-style: italic;
            color: #FF6B35;
            margin-bottom: 12px;
            font-weight: 500;
        }
        
        .signature .name {
            color: #2C3E50;
            font-weight: 700;
            font-size: 17px;
            margin-bottom: 5px;
        }
        
        .signature .brand {
            font-weight: 600;
            color: #FF6B35;
            font-size: 16px;
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
            .header h1 {
                font-size: 22px;
            }
            
            .countdown-badge {
                font-size: 20px;
                padding: 12px 25px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .event-card {
                padding: 25px 20px;
            }
            
            .event-card h2 {
                font-size: 19px;
            }
            
            .cta-button {
                display: block;
                padding: 14px 25px;
            }
            
            .action-items {
                flex-direction: column;
                align-items: center;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🎉 The Countdown Is On!</h1>
            <p>DeclutMart is almost here</p>
            <div class="countdown-badge">⏰ 24 HOURS</div>
        </div>
        
        <div class="content">
            <p class="greeting">Hey DeclutStar,</p>
            
            <p class="main-text">
                The countdown is officially on — <strong>DeclutMart launches in 24 hours!</strong> 🚀
            </p>
            
            <p class="main-text">
                We're so excited to finally bring this platform to life, a space where students can declutter easily, 
                sell what they no longer need, and connect with buyers who actually need those items. You've been with us 
                from the waitlist stage, and now it's time to see what we've built together! 💚
            </p>
            
            <div class="event-card">
                <h2>
                    <span class="event-icon">🎙️</span>
                    Join Our Launch X Space!
                </h2>
                
                <div class="event-details">
                    <p class="event-title">"Smart Spending, Smarter Living — The Student Guide to Financial Freedom"</p>
                    <p class="event-description">
                        An exciting conversation designed to help students make better money decisions while enjoying campus life. 
                        Come hang out with us as we share insights, laughs, and of course, launch DeclutMart together!
                    </p>
                </div>
                
                <a href="https://twitter.com/i/spaces/1dRKZaVbZPAxB" class="cta-button">
                    Join the X Space 🎉
                </a>
            </div>
            
            <div class="benefits-box">
                <h3>Why You Should Join:</h3>
                
                <div class="benefit-item">
                    <span class="check-icon">✓</span>
                    <span class="benefit-text">Be part of the official DeclutMart launch celebration</span>
                </div>
                
                <div class="benefit-item">
                    <span class="check-icon">✓</span>
                    <span class="benefit-text">Learn valuable tips on smart spending and financial freedom</span>
                </div>
                
                <div class="benefit-item">
                    <span class="check-icon">✓</span>
                    <span class="benefit-text">Connect with fellow students and the DeclutMart community</span>
                </div>
                
                <div class="benefit-item">
                    <span class="check-icon">✓</span>
                    <span class="benefit-text">Get exclusive insights on how to maximize the platform</span>
                </div>
            </div>
            
            <p class="main-text">
                It's going to be fun, inspiring, and the perfect way to kick off this journey.
            </p>
            
            <div class="closing">
                <p class="closing-text">
                    So, mark your calendar, tell a friend, and get ready to:
                </p>
                <div class="action-items">
                    <span class="action-badge">🛍️ Declutter</span>
                    <span class="action-badge">💰 Earn</span>
                    <span class="action-badge">🌟 Live Smarter</span>
                </div>
            </div>
            
            <div class="signature">
                <p class="excitement">With excitement,</p>
                <p class="name">Busari Rabiah Eniola</p>
                <p>Operations & Marketing Lead</p>
                <p class="brand">DeclutMart</p>
            </div>
        </div>
        
        <div class="footer">
            <p class="copyright">© 2024 DeclutMart. All rights reserved.</p>
            <p style="margin-top: 10px;">You're receiving this email because you joined our waitlist.</p>
        </div>
    </div>
</body>
</html>
        `
    );

    // Send a message to each email
    //     for (const email of waitlistEmails) {
    //       await sendBulkEmailBCC(
    //         email.email,
    //         "CONFIRMED: Your early access to DeclutMart starts Oct 15",
    //         `
    //           <!DOCTYPE html>
    // <html lang="en">
    // <head>
    //     <meta charset="UTF-8">
    //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
    //     <title>DeclutMart is Launching!</title>
    //     <style>
    //         * {
    //             margin: 0;
    //             padding: 0;
    //             box-sizing: border-box;
    //         }

    //         body {
    //             font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    //             background: #f5f5f5;
    //             padding: 20px;
    //             line-height: 1.6;
    //         }

    //         .email-container {
    //             max-width: 600px;
    //             margin: 0 auto;
    //             background: white;
    //             border-radius: 16px;
    //             overflow: hidden;
    //             box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    //         }

    //         .header {
    //             background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
    //             padding: 40px 30px;
    //             text-align: center;
    //             color: white;
    //             position: relative;
    //             overflow: hidden;
    //         }

    //         .header::before {
    //             content: '';
    //             position: absolute;
    //             top: -50%;
    //             right: -50%;
    //             width: 200%;
    //             height: 200%;
    //             background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    //             animation: pulse 3s ease-in-out infinite;
    //         }

    //         @keyframes pulse {
    //             0%, 100% { transform: scale(1); opacity: 0.5; }
    //             50% { transform: scale(1.1); opacity: 0.3; }
    //         }

    //         .header h1 {
    //             font-size: 28px;
    //             margin-bottom: 10px;
    //             font-weight: 700;
    //             position: relative;
    //             z-index: 1;
    //         }

    //         .header p {
    //             font-size: 18px;
    //             opacity: 0.95;
    //             position: relative;
    //             z-index: 1;
    //         }

    //         .hero-image {
    //             width: 100%;
    //             height: 300px;
    //             object-fit: cover;
    //             display: block;
    //         }

    //         .content {
    //             padding: 40px 30px;
    //         }

    //         .greeting {
    //             font-size: 20px;
    //             color: #FF6B35;
    //             font-weight: 600;
    //             margin-bottom: 20px;
    //         }

    //         .main-text {
    //             color: #333;
    //             font-size: 16px;
    //             margin-bottom: 20px;
    //         }

    //         .highlight-box {
    //             background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
    //             border-radius: 12px;
    //             padding: 30px;
    //             margin: 30px 0;
    //             color: white;
    //             text-align: center;
    //             box-shadow: 0 8px 25px rgba(255, 107, 53, 0.3);
    //             transform: translateY(0);
    //             transition: transform 0.3s ease;
    //         }

    //         .highlight-box:hover {
    //             transform: translateY(-5px);
    //         }

    //         .highlight-box h2 {
    //             font-size: 32px;
    //             margin-bottom: 10px;
    //             font-weight: 700;
    //         }

    //         .highlight-box p {
    //             font-size: 16px;
    //             opacity: 0.95;
    //         }

    //         .action-list {
    //             background: #FFF5F0;
    //             border-radius: 12px;
    //             padding: 30px;
    //             margin: 25px 0;
    //             border: 2px solid #FFE5D9;
    //         }

    //         .action-list h3 {
    //             color: #2C3E50;
    //             font-size: 20px;
    //             margin-bottom: 20px;
    //             text-align: center;
    //             font-weight: 600;
    //         }

    //         .action-item {
    //             display: flex;
    //             align-items: flex-start;
    //             margin-bottom: 18px;
    //             padding: 18px;
    //             background: white;
    //             border-radius: 10px;
    //             border-left: 4px solid #FF6B35;
    //             transition: all 0.3s ease;
    //             box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    //         }

    //         .action-item:hover {
    //             transform: translateX(8px);
    //             box-shadow: 0 4px 15px rgba(255, 107, 53, 0.15);
    //         }

    //         .action-item:last-child {
    //             margin-bottom: 0;
    //         }

    //         .action-icon {
    //             width: 40px;
    //             height: 40px;

    //             display: flex;
    //             align-items: center;
    //             justify-content: center;
    //             color: white;
    //             font-weight: bold;
    //             margin-right: 15px;
    //             flex-shrink: 0;
    //             font-size: 18px;
    //             box-shadow: 0 4px 10px rgba(255, 107, 53, 0.3);
    //         }

    //         .action-text {
    //             color: #333;
    //             font-size: 15px;
    //             line-height: 1.6;
    //         }

    //         .action-text strong {
    //             color: #2C3E50;
    //         }

    //         .closing {
    //             text-align: center;
    //             margin: 35px 0;
    //             padding: 25px;
    //             background: #FFF5F0;
    //             border-radius: 12px;
    //         }

    //         .closing-highlight {
    //             font-size: 18px;
    //             color: #FF6B35;
    //             font-weight: 600;
    //             margin-bottom: 10px;
    //         }

    //         .closing-main {
    //             font-size: 22px;
    //             color: #2C3E50;
    //             font-weight: 700;
    //         }

    //         .signature {
    //             margin-top: 40px;
    //             padding-top: 30px;
    //             border-top: 2px solid #FFE5D9;
    //         }

    //         .signature p {
    //             color: #666;
    //             font-size: 15px;
    //             margin: 5px 0;
    //         }

    //         .signature .excitement {
    //             font-style: italic;
    //             color: #FF6B35;
    //             margin-bottom: 15px;
    //             font-weight: 500;
    //         }

    //         .signature .name {
    //             color: #2C3E50;
    //             font-weight: 700;
    //             font-size: 17px;
    //             margin-bottom: 5px;
    //         }

    //         .signature .brand {
    //             font-weight: 600;
    //             color: #FF6B35;
    //             font-size: 16px;
    //         }

    //         .footer {
    //             background: #2C3E50;
    //             padding: 30px 25px;
    //             text-align: center;
    //             color: #fff;
    //         }

    //         .footer p {
    //             font-size: 13px;
    //             opacity: 0.8;
    //             margin: 5px 0;
    //         }

    //         .cta-badge {
    //             display: inline-block;
    //             background: #4CAF50;
    //             color: white;
    //             padding: 8px 18px;
    //             border-radius: 20px;
    //             font-size: 13px;
    //             font-weight: 600;
    //             margin-top: 10px;
    //         }

    //         @media (max-width: 600px) {
    //             .header h1 {
    //                 font-size: 24px;
    //             }

    //             .content {
    //                 padding: 30px 20px;
    //             }

    //             .hero-image {
    //                 height: 200px;
    //             }

    //             .highlight-box h2 {
    //                 font-size: 26px;
    //             }

    //             .action-item {
    //                 padding: 15px;
    //             }
    //         }
    //     </style>
    // </head>
    // <body>
    //     <div class="email-container">
    //     <div class="header">
    //      <h1>🎉 Big News!</h1>
    //             <p>The wait is almost over</p>
    //         </div>

    //         <img src="https://ik.imagekit.io/P2PINNOVATORS/Assets/photo_5992352558112426863_y%20(1).jpg?updatedAt=1759820988526" alt="DeclutMart Launch" class="hero-image">

    //         <div class="content">
    //             <p class="greeting">Dear DeclutStar,</p>

    //             <div class="highlight-box">
    //                 <h2>October 15</h2>
    //                 <p>DeclutMart is officially launching!</p>
    //             </div>

    //             <p class="main-text">
    //                 Guess what? <strong>You're one of the amazing people who get to be part of our soft launch first!</strong>
    //                 We can't thank you enough for joining our waitlist and believing in what we're building.
    //             </p>

    //             <p class="main-text">
    //                 DeclutMart is all about helping students declutter easily and connect with buyers who actually need their stuff,
    //                 and it's finally coming to life!
    //             </p>

    //             <div class="action-list">
    //                 <h3>Here's what you can do to get ready:</h3>

    //                 <div class="action-item">
    //                     <div class="action-icon">📦</div>
    //                     <div class="action-text">
    //                         <strong>Gather those items you've been meaning to sell</strong> – it's time to give them a second home.
    //                     </div>
    //                 </div>

    //                 <div class="action-item">
    //                     <div class="action-icon">🌟</div>
    //                     <div class="action-text">
    //                         <strong>Get ready to explore</strong> a community of students buying and selling smartly.
    //                     </div>
    //                 </div>

    //                 <div class="action-item">
    //                     <div class="action-icon">💬</div>
    //                     <div class="action-text">
    //                         <strong>Spread the word</strong> – invite your friends to join the movement and become fellow DeclutStars!
    //                     </div>
    //                 </div>
    //             </div>

    //             <p class="main-text">
    //                 This soft launch is just the beginning, and <strong>your feedback will help us make DeclutMart even better.</strong>
    //                 So get ready to click, list, and declutter like never before!
    //             </p>

    //             <div class="closing">
    //                 <p class="closing-highlight">
    //                     We're so excited to have you onboard.
    //                 </p>
    //                 <p class="closing-main">
    //                     October 15 is going to be unforgettable! 🚀
    //                 </p>
    //                 <span class="cta-badge">✓ You're On The List</span>
    //             </div>

    //             <div class="signature">
    //                 <p class="excitement">With excitement,</p>
    //                 <p class="name">Busari Rabiah Eniola</p>
    //                 <p>Operations & Marketing Lead</p>
    //                 <p class="brand">DeclutMart</p>
    //             </div>
    //         </div>

    //         <div class="footer">
    //             <p style="font-weight: 600; font-size: 14px; opacity: 1;">© 2024 DeclutMart. All rights reserved.</p>
    //             <p style="margin-top: 10px;">You're receiving this email because you joined our waitlist.</p>
    //         </div>
    //     </div>
    // </body>
    // </html>
    //         `
    //       );
    //     }

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
  next: NextFunction
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
