import { Request, Response, NextFunction } from "express";
import { SupportTicket } from "../models/supportTicket";
import { User } from "../models/userModel";
import { sendEmail } from "../utils/mail";
import { Admin } from "../models/adminModel";
import { getIdFromToken } from "../function/token";
import { Types } from "mongoose";

export const createTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subject, description, issueType, imageUrls } = req.body;
    const user = await User.findById(getIdFromToken(req));
    if (!user) {
      res.status(401).json({
        success: false,
        message: "You are not authorized to perform this action",
        data: null,
      });
      return;
    }

    // Validate issue type
    const validIssueTypes = [
      "account",
      "payment",
      "orders",
      "technical",
      "others",
    ];
    if (!validIssueTypes.includes(issueType)) {
      res.status(400).json({
        success: false,
        message:
          "Invalid issue type. Must be one of: account, payment, orders, technical, others",
        data: null,
      });
      return;
    }

    const newTicket = await SupportTicket.create({
      subject,
      description,
      issueType,
      imageUrls: imageUrls || [],
      userId: user._id,
      status: "open",
    });

    // Notify all the Admins
    const admins = await Admin.find({ is_admin: true });
    const adminEmails = admins.map((admin) => admin.email).join(",");
    sendEmail(
      adminEmails,
      "New Support Ticket Created",
      `A new support ticket has been created by user ${user.fullName}. Subject: ${subject}. Issue Type: ${issueType}. Description: ${description}`
    );

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      data: newTicket,
    });
  } catch (error) {
    next(error);
  }
};

export const addReplyToTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reply } = req.body;
    const { id } = req.params;
    const senderId = getIdFromToken(req);

    // Check if admin
    const admin = await Admin.findById(senderId);
    // const isAdmin = !!admin;

    // if the sender is not admin check if its user
    const user = !admin ? await User.findById(senderId) : null;
    if (!admin && !user) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to reply to this ticket",
        data: null,
      });
      return;
    }
    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      res.status(404).json({
        success: false,
        message: "Support ticket not found",
        data: null,
      });
      return;
    }

    ticket.replies.push({
      message: reply,
      sender: new Types.ObjectId(senderId),
      createdAt: new Date(),
      senderType: admin ? "Admin" : "User",
    });
    await ticket.save();

    // Notify the user if the sender is admin
    if (admin) {
      const user = await User.findById(ticket.userId);
      if (user) {
        sendEmail(
          user.email,
          "New Reply to Your Support Ticket",
          `Admin replied to your support ticket with subject: ${ticket.subject}. Reply: ${reply}`
        );
      }
    }
    res.status(200).json({
      success: true,
      message: "Reply added successfully",
      data: ticket,
    });
    return;
  } catch (error) {
    next(error);
  }
};
