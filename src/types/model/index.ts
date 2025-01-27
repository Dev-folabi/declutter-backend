import { Document, Schema } from "mongoose";

export interface ISchool extends Document {
  schoolName: string;
  location: string;
}

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  schoolId: Schema.Types.ObjectId;
  schoolIdCardURL?: string;
  nin?: string;
  accountName?: string;
  accountNumber?: string;
  bankCode?: string;
  pin?: string;
  role: string[];
  sellerStatus: string;
  emailVerified: boolean;
  sellerProfileComplete: boolean;
  profileImageURL : string;
}

export interface OTPVerificationModelType {
  user: Schema.Types.ObjectId;
  OTP: string;
  type: "password" | "transaction pin" | "activate account";
  verificationType: string;
}

export interface NotificationType {
  user: Schema.Types.ObjectId;
  body: string;
  type: "account" | "market" | "promotion";
  title: string;
}
