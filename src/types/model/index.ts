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
  sellerProfileComplete: boolean;
}

export interface OTPVerificationModelType {
  user: Schema.Types.ObjectId;
  OTP: string;
  type: "password" | "transaction pin";
  verificationType: string;
}
