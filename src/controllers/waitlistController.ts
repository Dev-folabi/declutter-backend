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
