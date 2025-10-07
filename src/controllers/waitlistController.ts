import { NextFunction, Request, Response } from "express";
import { Waitlist } from "../models/waitlist";
import { sendEmail } from "../utils/mail";

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

    // Send a message to each email
    for (const email of waitlistEmails) {
      await sendEmail(
        email.email,
        "DeclutMart",
        `
          <div class="header">
            Thank you for joining the DeclutMart waitlist! 🎉
          </div>
          <div class="content">
            <p>Dear DeclutStar,</p>
            <p>We’ve been working hard to create a platform that helps students declutter and sell their goods effortlessly. Your support means everything to us, and we can’t wait to share it with you soon!</p>
            <br />
            <p>Stay tuned, exciting updates are on the way!</p>
          </div>
          <br />
        `
      );
    }

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
