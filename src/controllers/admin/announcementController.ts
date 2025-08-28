import { User } from "../../models/userModel";
import { Admin } from "../../models/adminModel";
import { Announcement } from "../../models/announcement";
import { getIdFromToken } from "../../function/token";
import { sendBulkEmailBCC } from "../../utils/mail";
import { handleError } from "../../error/errorHandler";
import { Request, Response, NextFunction } from "express";

interface AnnouncementRequest {
  title: string;
  message: string;
  category: "Buyers" | "Sellers" | "All";
}

export const createAnnouncement = async (
  req: Request<{}, {}, AnnouncementRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, message, category } = req.body;

    // Input validation
    if (!title || !message || !category) {
      return handleError(
        res,
        400,
        "Title, message, and category are required fields."
      );
    }

    if (title.trim().length < 3) {
      return handleError(res, 400, "Title must be at least 3 characters long.");
    }

    if (message.trim().length < 10) {
      return handleError(
        res,
        400,
        "Message must be at least 10 characters long."
      );
    }

    const validCategories = ["Buyers", "Sellers", "All"];
    if (!validCategories.includes(category)) {
      return handleError(
        res,
        400,
        "Invalid category. Must be 'Buyers', 'Sellers', or 'All'."
      );
    }

    // Get admin ID and verify authorization
    const adminId = getIdFromToken(req);
    if (!adminId) {
      return handleError(res, 401, "Authentication token is required.");
    }

    const admin = await Admin.findById(adminId).select("_id role");
    if (!admin) {
      return handleError(
        res,
        401,
        "You are not authorized to perform this action."
      );
    }

    // Create announcement
    const newAnnouncement = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      category,
      createdBy: admin._id,
    });

    let users;
    const emailProjection = { email: 1, _id: 0 };

    switch (category) {
      case "Buyers":
        users = await User.find({ role: "buyer" }, emailProjection);
        break;
      case "Sellers":
        users = await User.find({ role: "seller" }, emailProjection);
        break;
      case "All":
        users = await User.find({}, emailProjection);
        break;
      default:
        return handleError(
          res,
          400,
          "Invalid category. Must be 'Buyers', 'Sellers', or 'All'."
        );
    }

    if (!users || users.length === 0) {
      return handleError(
        res,
        404,
        `No active users found for category: ${category}`
      );
    }

    // Extract emails and validate
    const userEmails = users
      .map((user) => user.email)
      .filter((email) => email && email.includes("@"));

    if (userEmails.length === 0) {
      return handleError(
        res,
        400,
        "No valid email addresses found for the selected category."
      );
    }

    setImmediate(async () => {
      try {
        const emailResults = await sendBulkEmailBCC(
          userEmails,
          `New Announcement: ${title}`,
          message
        );

        console.log(
          `Announcement emails sent successfully! Success: ${emailResults.success}, Failed: ${emailResults.failed}`
        );

        if (emailResults.failed > 0) {
          console.warn(`Some emails failed to send:`, emailResults.errors);
        }
      } catch (emailError) {
        console.error("Failed to send announcement emails:", emailError);
      }
    });

    // Populate the created announcement with admin details for response
    const populatedAnnouncement = await newAnnouncement.populate({
      path: "createdBy",
      select: "fullName email role",
    });

    res.status(201).json({
      success: true,
      message: `Announcement created successfully and will be sent to ${userEmails.length} recipients.`,
      data: {
        announcement: populatedAnnouncement,
        recipientCount: userEmails.length,
        category,
      },
    });
  } catch (error) {
    console.error("Error creating announcement:", error);
    next(error);
  }
};
