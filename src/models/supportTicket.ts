import {model, Schema, } from "mongoose";
import {ISupportTicket} from "../types/model/index"

const supportTicketSchema = new Schema<ISupportTicket> (
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User"
        },
        subject: {
            type: String,
            required: true
        },
        issueType: {
            type: String,
            enum: ['account', 'payment', 'orders', 'technical', 'others'],
            required: true
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: "Admin",
        },
        assignedBy: {
            type: Schema.Types.ObjectId,
            ref: "Admin",
        },
        assignmentMessage: {
            type: String
        },
        imageUrls: {
            type: [String],
            default: []
        },
        replies: [
            {
                sender: {
                    type: Schema.Types.ObjectId,
                    refPath: 'replies.senderType',
                    required: true
                },
                senderType: {
                    type: String,
                    enum: ["User", "Admin"],
                    required: true
                },
                message: {
                    type: String,
                    required: true
                },
                createdAt: {type: Date, default: Date.now}
            }
        ],
        adminNotes:  [
            {
                note:{type: String, required: true},
                admin: {type: Schema.Types.ObjectId, required: true},
                createdAt: {type: Date, default: Date.now}
            }
        ],
        description: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["open", "in_progress",  "resolved", "closed"],
            default: "open"
        }
    },
    {timestamps: true}
)
export const SupportTicket = model<ISupportTicket>('SupportTicket',  supportTicketSchema );