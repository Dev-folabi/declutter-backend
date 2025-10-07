import { Request, Response, NextFunction } from "express";
import { SupportTicket } from "../models/supportTicket";
import { getIdFromToken } from "../function/token";
import { User } from "../models/userModel";
import { Admin } from "../models/adminModel";
import { sendBulkEmailBCC, sendEmail } from "../utils/mail";
import { uploadMultipleToImageKit } from "../utils/imagekit";
import { Types } from "mongoose";
import { createNotification } from "./notificationController";
import { CreateNotificationData } from "../types/model";

export const createTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = getIdFromToken(req);
    const { subject, description, issueType } = req.body;
    const files = req.files as Express.Multer.File[];

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

    let imageUrls: string[] = [];

    // Handle image uploads
    if (files && files.length > 0) {
      imageUrls = await uploadMultipleToImageKit(files, "/support-tickets", [
        "support",
        "ticket",
      ]);
    }

    const ticket = await SupportTicket.create({
      userId,
      subject,
      description,
      issueType,
      imageUrls,
      status: "open",
    });

    // Notify all the Admins via email
    const admins = await Admin.find({
      is_admin: true,
      role: { $in: ["admin", "super_admin"] },
    });
    const adminEmails = admins.map((admin) => admin.email);
    sendBulkEmailBCC(
      adminEmails,
      "New Support Ticket Created",
      `A new support ticket has been created by user ${user.fullName}. 
      </br>
      Subject: ${subject}. 
      </br>
      Issue Type: ${issueType}. 
      <br/>
      Description: ${description}`
    );

    // Create in-app notifications for all admins
    const adminNotificationPromises = admins.map((admin) => {
      const notificationData: CreateNotificationData = {
        recipient: admin._id as string,
        recipientModel: "Admin" as const,
        body: `New support ticket created by ${user.fullName}. Subject: ${subject}. Issue Type: ${issueType}.`,
        type: "account",
        title: "New Support Ticket",
      };
      return createNotification(notificationData);
    });

    await Promise.allSettled(adminNotificationPromises);

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      data: ticket,
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
          `Admin replied to your support ticket with subject: ${ticket.subject}. 
          </br>
          Reply: ${reply}`
        );
      }
    } else {
      // If user replied, notify all admins via in-app notifications
      const admins = await Admin.find({ is_admin: true });
      const adminNotificationPromises = admins.map((adminUser) => {
        const notificationData: CreateNotificationData = {
          recipient: adminUser._id as string,
          recipientModel: "Admin" as const,
          body: `${user?.fullName} replied to support ticket: ${ticket.subject}. Reply: ${reply}`,
          type: "account",
          title: "New Ticket Reply",
        };
        return createNotification(notificationData);
      });

      await Promise.allSettled(adminNotificationPromises);
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
