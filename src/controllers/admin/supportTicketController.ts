import { Request, Response, NextFunction } from "express";
import { SupportTicket } from "../../models/supportTicket";
import { User } from "../../models/userModel";
import { sendEmail } from "../../utils/mail";
import { Admin } from "../../models/adminModel";
import { getIdFromToken } from "../../function/token";
import { Types } from "mongoose";

export const getAllTickets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10, status, issueType, assignedTo } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter: any = {};
    if (status) filter.status = status;
    if (issueType) filter.issueType = issueType;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tickets = await SupportTicket.find(filter)
      .populate("userId", "fullName email")
      .populate("assignedTo", "fullName email role")
      .populate("assignedBy", "fullName email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await SupportTicket.countDocuments(filter);

    // Format response with required details
    const formattedTickets = tickets.map((ticket) => ({
      _id: ticket._id,
      subject: ticket.subject,
      issueType: ticket.issueType,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      user: {
        _id: (ticket.userId as any)._id,
        fullName: (ticket.userId as any).fullName,
        email: (ticket.userId as any).email,
      },
      assignedTo: ticket.assignedTo
        ? {
            _id: (ticket.assignedTo as any)._id,
            fullName: (ticket.assignedTo as any).fullName,
            email: (ticket.assignedTo as any).email,
            role: (ticket.assignedTo as any).role,
          }
        : null,
      assignedBy: ticket.assignedBy
        ? {
            _id: (ticket.assignedBy as any)._id,
            fullName: (ticket.assignedBy as any).fullName,
            email: (ticket.assignedBy as any).email,
            role: (ticket.assignedBy as any).role,
          }
        : null,
      assignmentMessage: ticket.assignmentMessage,
      repliesCount: ticket.replies.length,
      adminNotesCount: ticket.adminNotes.length,
    }));

    res.status(200).json({
      success: true,
      message: "Tickets retrieved successfully",
      data: {
        tickets: formattedTickets,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalTickets: total,
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTicketById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const ticket = await SupportTicket.findById(id)
      .populate("userId", "fullName email profileImageURL")
      .populate("assignedTo", "fullName email role")
      .populate("assignedBy", "fullName email role")
      .populate("replies.sender", "fullName email")
      .populate("adminNotes.admin", "fullName email role");

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: "Support ticket not found",
        data: null,
      });
      return;
    }

    // Format the response to include full details
    const formattedTicket = {
      _id: ticket._id,
      subject: ticket.subject,
      description: ticket.description,
      issueType: ticket.issueType,
      status: ticket.status,
      imageUrls: ticket.imageUrls || [],
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      user: {
        _id: (ticket.userId as any)._id,
        fullName: (ticket.userId as any).fullName,
        email: (ticket.userId as any).email,
        profileImageURL: (ticket.userId as any).profileImageURL,
      },
      assignedTo: ticket.assignedTo
        ? {
            _id: (ticket.assignedTo as any)._id,
            fullName: (ticket.assignedTo as any).fullName,
            email: (ticket.assignedTo as any).email,
            role: (ticket.assignedTo as any).role,
          }
        : null,
      assignedBy: ticket.assignedBy
        ? {
            _id: (ticket.assignedBy as any)._id,
            fullName: (ticket.assignedBy as any).fullName,
            email: (ticket.assignedBy as any).email,
            role: (ticket.assignedBy as any).role,
          }
        : null,
      assignmentMessage: ticket.assignmentMessage,
      replies: ticket.replies.map((reply) => ({
        _id: reply.sender,
        message: reply.message,
        senderType: reply.senderType,
        createdAt: reply.createdAt,
        sender: {
          _id: (reply.sender as any)._id,
          fullName: (reply.sender as any).fullName,
          email: (reply.sender as any).email,
        },
      })),
      adminNotes: ticket.adminNotes.map((note) => ({
        _id: note.admin,
        note: note.note,
        createdAt: note.createdAt,
        admin: {
          _id: (note.admin as any)._id,
          fullName: (note.admin as any).fullName,
          email: (note.admin as any).email,
          role: (note.admin as any).role,
        },
      })),
    };

    res.status(200).json({
      success: true,
      message: "Support ticket retrieved successfully.",
      data: formattedTicket,
    });
  } catch (error) {
    next(error);
  }
};

// New function to assign ticket to another admin
export const assignTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { assignedToId, message } = req.body;
    const assignedById = getIdFromToken(req);

    // Validate the assigning admin
    const assigningAdmin = await Admin.findById(assignedById);
    if (!assigningAdmin) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action",
        data: null,
      });
      return;
    }

    // Validate the admin being assigned to
    const assignedToAdmin = await Admin.findById(assignedToId);
    if (!assignedToAdmin) {
      res.status(404).json({
        success: false,
        message: "Admin to assign ticket to not found",
        data: null,
      });
      return;
    }

    // Find the ticket
    const ticket = await SupportTicket.findById(id).populate(
      "userId",
      "fullName email"
    );
    if (!ticket) {
      res.status(404).json({
        success: false,
        message: "Support ticket not found",
        data: null,
      });
      return;
    }

    // Update ticket assignment
    ticket.assignedTo = assignedToId;
    ticket.assignedBy = assigningAdmin.id;
    ticket.assignmentMessage = message;
    ticket.status = "in_progress";

    await ticket.save();

    // Add admin note about the assignment
    ticket.adminNotes.push({
      note: `Ticket assigned to ${assignedToAdmin.fullName} by ${assigningAdmin.fullName}. Message: ${message || "No message provided"}`,
      admin: assigningAdmin.id,
      createdAt: new Date(),
    });

    await ticket.save();

    // Notify the assigned admin
    sendEmail(
      assignedToAdmin.email,
      "Support Ticket Assigned to You",
      `You have been assigned a support ticket by ${assigningAdmin.fullName}. Subject: ${ticket.subject}. Message: ${message || "No additional message"}. Please check your admin dashboard for details.`
    );

    // Notify the user about the assignment
    const user = ticket.userId as any;
    if (user) {
      sendEmail(
        user.email,
        "Your Support Ticket Has Been Assigned",
        `Your support ticket with subject "${ticket.subject}" has been assigned to our ${assignedToAdmin.role} team for resolution. You will receive updates as we work on your request.`
      );
    }

    res.status(200).json({
      success: true,
      message: "Ticket assigned successfully",
      data: {
        ticketId: ticket._id,
        assignedTo: {
          _id: assignedToAdmin._id,
          fullName: assignedToAdmin.fullName,
          email: assignedToAdmin.email,
          role: assignedToAdmin.role,
        },
        assignedBy: {
          _id: assigningAdmin._id,
          fullName: assigningAdmin.fullName,
          email: assigningAdmin.email,
          role: assigningAdmin.role,
        },
        assignmentMessage: message,
        status: ticket.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTicketStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      res.status(404).json({
        success: false,
        message: "Ticket not found",
        data: null,
      });
      return;
    }
    ticket.status = status;
    await ticket.save();

    // Notify the user about the status update
    const user = await User.findById(ticket.userId);
    if (user) {
      sendEmail(
        user.email,
        "Support Ticket Status Update",
        `Your support ticket with subject "${ticket.subject}" has been updated to status: ${status}.`
      );
    }
    res.status(200).json({
      success: true,
      message: "Ticket status updated successfully",
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// delete ticket
export const deleteTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const deleteTicket = await SupportTicket.findByIdAndDelete(id);
    if (!deleteTicket) {
      res.status(404).json({
        success: false,
        message: "Support ticket not found",
        data: null,
      });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Support ticket deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const addAdminNotes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { note } = req.body;
    const { id } = req.params;
    const admin = await Admin.findById(getIdFromToken(req));
    if (!admin) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action",
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
    ticket.adminNotes.push({
      note,
      admin: admin._id as Types.ObjectId,
      createdAt: new Date(),
    });

    await ticket.save();

    // Notify the user about the admin note
    const user = await User.findById(ticket.userId);
    if (user) {
      sendEmail(
        user.email,
        "Admin Note Added",
        `An admin note has been added to your support ticket with subject "${ticket.subject}". Note: ${note}`
      );
    }
    res.status(200).json({
      success: true,
      message: "Admin note added successfully",
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};
