import { Request, Response, NextFunction} from "express";
import { SupportTicket} from "../../models/supportTicket"
import { User } from "../../models/userModel";
import { sendEmail } from "../../utils/mail";
import { Admin } from "../../models/adminModel";
import { getIdFromToken } from "../../function/token";
import { Types } from "mongoose";

export const getAllTickets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tickets = await SupportTicket.find().populate('userId', 'fullName email');
        res.status(200).json({
            success: true,
            message: "Tickets retrieved successfully",
            data: tickets
        });
    } catch (error) {
        next(error);
    }
};

export const updateTicketStatus = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const { id } = req.params;
        const {status} = req.body;
        const ticket = await SupportTicket.findById(id);
        if (!ticket) {
            res.status(404).json({
                success: false,
                message: "Ticket not found",
                data: null
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
            data: ticket
        })
    } catch(error) {
        next(error);
    }
}

// delete ticket 
export const deleteTicket = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const {id} = req.params;
        const deleteTicket = await SupportTicket.findByIdAndDelete(id);
        if (!deleteTicket) {
            res.status(404).json({
                success: false,
                message: " Suport ticket not found",
                data: null
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Support ticket deleted successfully"
        })

    } catch(error) {
        next(error)
    }
}


export const getTicketById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const ticket = await SupportTicket.findById(id)
      
        if (!ticket) {
        res.status(404).json({ message: 'Support ticket  not found' });
      }
      res.status(200).json({
        success: true,
        message: 'Support ticket retrieved successfully.',
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
};

export const addAdminNotes = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const {note} = req.body;
        const {id} = req.params;
        const admin = await Admin.findById(getIdFromToken(req)) 
        if (!admin) {
            res.status(403).json({
                success: false,
                message: "You are not authorized to perform this action",
                data: null
            });
            return;
        }
        const ticket = await SupportTicket.findById(id);
        if (!ticket) {
            res.status(404).json({
                success: false,
                message: "Support ticket not found",
                data: null
            });
            return;
        }
        ticket.adminNotes.push({
            note,
            admin:  admin._id as Types.ObjectId,
           createdAt: new Date() 
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
            data: ticket
        });
    } catch(error) {
        next(error);
    }
}