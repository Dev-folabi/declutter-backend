// models/Admin.ts
import mongoose, { Schema, Document } from 'mongoose';
import { IAdmin } from '../types/model/index';
const AdminSchema = new Schema<IAdmin>(
  {
    fullName: { type: String, required: true, uppercase: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minLength: 8 },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'SUPPORT_AGENT'],
      required: true,
    },
    // isMFAEnabled: { type: Boolean, default: false },
    // mfaSecret: { type: String },
    // isSuspended: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date },
  },
  { timestamps: true }
);

export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);
