import { extend } from 'lodash';
import {  Document, Schema, Types } from 'mongoose';

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
    balance?: number;
    pendingBalance?: number;
  };
  pin: string;
  role: string[];
  sellerStatus: string;
  emailVerified: boolean;
  sellerProfileComplete: boolean;
  profileImageURL: string;
  is_admin: boolean;
  status: 'active' | 'inactive' | 'suspended';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  adminComments?: string;
  isSuspended: boolean;
}

export interface OTPVerificationModelType {
  owner:{
    id: Schema.Types.ObjectId,
    type: 'User' | "Admin"
  }
  OTP: string;
  type: 'password' | 'transaction pin' | 'activate account' | 'edit profile';
  verificationType: string;
}

export interface NotificationType {
  // user: Schema.Types.ObjectId;
  recipient: IUser['_id'] | IAdmin['_id'];
  recipientModel: 'User' | 'Admin';
  body: string;
  type: 'account' | 'market' | 'promotion';
  title: string;
  is_read: boolean;
}

export interface ContactUsModelType {
  body: string;
  fullName: string;
  email: string;
  issue: 'account' | 'payment' | 'orders' | 'others';
  is_closed: boolean;
}

export interface ProductListingType extends Document {
  name: string;
  price: number;
  productId: string;
  productImage: string[];
  productVideos: string[];
  category:
    | 'electronics'
    | 'books & stationery'
    | 'clothing & accessories'
    | 'furniture'
    | 'home & kitchen'
    | 'sports & fitness equipment'
    | 'gaming & entertainment'
    | 'health & personal care'
    | 'hobbies & crafts'
    | 'miscellaneous';
  location: string;
  description: string;
  is_approved: boolean;
  rejection_reason?: string;
  is_sold: boolean;
  is_reserved: boolean;
  hasSettled: boolean;
  seller: Schema.Types.ObjectId;
  status: 'approved' | 'pending' | 'rejected' | 'flagged' | 'removed';
  flags: {
    reason: string;
    flaggedBy: Types.ObjectId;
    date: Date;
  }[];
}

// Interface for CartItem
export interface ICartItem extends Document {
  product: Schema.Types.ObjectId;
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
  quantity: number;
  price: number;
}

// Interface for Order
export interface IOrder extends Document {
  user: Schema.Types.ObjectId;
  items: IOrderItem[];
  totalPrice: number;
  status: string;
}

// Interface for Order
export interface IWeListened extends Document {
  name: string;
  statement: string;
  school: string;
  is_active: boolean;
}

// interface for Admin
export interface IAdmin extends Document {
  fullName: string;
  email: string;
  password: string;
  role: 'SUPER_ADMIN' | 'SUPPORT_AGENT';
  emailVerified: boolean;
  otp?: string;
  otpExpires?: Date;
}

// interface for admin activity log
export interface IAdminActivityLog extends Document {
  admin: Schema.Types.ObjectId;
  user: Schema.Types.ObjectId;
  action: string;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
