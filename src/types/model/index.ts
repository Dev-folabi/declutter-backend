import { extend } from "lodash";
import { Date, Document, Schema } from "mongoose";

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
  accountDetail?: {
    accountName?: string;
    accountNumber?: string;
    bankCode?: string;
    bankName?: string;
    recipientCode?: string;
  };
  pin: string;
  role: string[];
  sellerStatus: string;
  emailVerified: boolean;
  sellerProfileComplete: boolean;
  profileImageURL: string;
  is_admin: boolean;
}

export interface OTPVerificationModelType {
  user: Schema.Types.ObjectId;
  OTP: string;
  type: "password" | "transaction pin" | "activate account" | "edit profile";
  verificationType: string;
}

export interface NotificationType {
  user: Schema.Types.ObjectId;
  body: string;
  type: "account" | "market" | "promotion";
  title: string;
  is_read: boolean;
}

export interface ProductListing extends Document {
  name: string;
  price: Number;
  productId: string;
  category:
    | "electronics"
    | "books & stationery"
    | "clothing & accessories"
    | "furniture"
    | "home & kitchen"
    | "sports & fitness equipment"
    | "gaming & entertainment"
    | "health & personal care"
    | "hobbies & crafts"
    | "miscellaneous";
  location: string;
  description: string;
  is_approved: boolean;
  is_sold: boolean;
  seller: Schema.Types.ObjectId;
}

export interface ProductListingImage extends Document {
  product: Schema.Types.ObjectId;
  image_url: string;
}
