import mongoose, { Schema } from 'mongoose';
import { IAdminActivityLog } from '../types/model'; 

const adminActivityLogSchema = new Schema<IAdminActivityLog>(
  {
    admin: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    note: { type: String },
  },
  { timestamps: true }
);

export const AdminActivityLog= mongoose.model<IAdminActivityLog>(
  'AdminActivityLog',
  adminActivityLogSchema
);