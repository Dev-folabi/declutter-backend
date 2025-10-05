// models/Admin.ts
import mongoose, { Schema, Document } from 'mongoose';
import { IAdmin } from '../types/model/index';
import { ROLES } from '../constant';
const AdminSchema = new Schema<IAdmin>(
  {
    fullName: { type: String, required: true, uppercase: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minLength: 8 },
    role: {
      type: String,
      enum: ROLES,
      required: true,
    },
    emailVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date },
    is_admin: {
      type: Boolean,
      default: true
    },
    profileImageURL: { type: String, required: false },
  },
  { timestamps: true }
);

export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);
