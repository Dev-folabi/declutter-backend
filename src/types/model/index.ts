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

export interface ContactUsModelType {
  body: string;
  fullName: string;
  email: string;
  issue: "account" | "payment" | "orders" | "others";
  is_closed: boolean;
}

export interface ProductListingType extends Document {
  name: string;
  price: number;
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
  is_reserved: boolean;
  seller: Schema.Types.ObjectId;
}

export interface ProductListingImage extends Document {
  product: Schema.Types.ObjectId;
  image_url: string;
}

// Interface for CartItem
export interface ICartItem extends Document {
  product: Schema.Types.ObjectId;
  cart: Schema.Types.ObjectId;
  quantity: number;
  price: number;
}

// Interface for Cart
export interface ICart extends Document {
  user: Schema.Types.ObjectId;
  items: ICartItem[];
  totalPrice: number;
}

// Interface for OrderItem
export interface IOrderItem extends Document {
  product: Schema.Types.ObjectId;
  order: Schema.Types.ObjectId;
  quantity: number;
  price: number;
}

// Interface for Order
export interface IOrder extends Document {
  user: Schema.Types.ObjectId;
  // items: IOrderItem[];
  totalPrice: number;
}

// Interface for Order
export interface IWeListened extends Document {
  name: string;
  statement: string;
  school: string;
  is_active: boolean;
}
