import { Request, Response } from "express";
import { Waitlist } from "../models/waitlist";

export const collectWaitlistEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Check if the email already exists in the waitlist
    const existingEmail = await Waitlist.findOne({ email });
    if (existingEmail) {
      res.status(400).json({ message: "Email already waitlisted, thanks!" });
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

    // Respond with success
    res.status(200).json({ message: "Email added to the waitlist" });
  } catch (error) {
    console.error("Error adding email to waitlist:", error); // Log the error for debugging
    res.status(500).json({
      message: "An error occurred while adding the email to the waitlist",
    });
  }
};
