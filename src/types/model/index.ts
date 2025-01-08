import { Document, ObjectId } from "mongoose";

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  schoolId: ObjectId;
  schoolIdCard?: string;
  nin?: string;
  accountName?: string;
  accountNumber?: string;
  bankCode?: string;
  pin?: string;
  role: string[];
  sellerStatus: string;
  isVerified: boolean;
}
