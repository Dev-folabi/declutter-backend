import { Document, Schema, Types } from "mongoose";

export interface ISchool extends Document {
  schoolName: string;
  location: string;
}

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  lastLogin?: Date;
  schoolId: Schema.Types.ObjectId;
  schoolIdCardURL?: string;
  ninURL?: string;
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
  rejectionReason?: string;
  adminComment?: string;
  emailVerified: boolean;
  sellerProfileComplete: boolean;
  profileImageURL: string;
  is_admin: boolean;
  status: "active" | "inactive" | "suspended";
  isSuspended: boolean;
}

export interface OTPVerificationModelType {
  owner: {
    id: Schema.Types.ObjectId;
    type: "User" | "Admin";
  };
  OTP: string;
  type: "password" | "transaction pin" | "activate account" | "edit profile";
  verificationType: string;
}

export interface NotificationType {
  // user: Schema.Types.ObjectId;
  recipient: IUser["_id"] | IAdmin["_id"];
  recipientModel: "User" | "Admin";
  body: string;
  type?: "account" | "market" | "promotion" | "refund";
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
  quantity: number;
  productId: string;
  productImage: string[];
  productVideos: string[];
  category: Schema.Types.ObjectId;
  location: string;
  description: string;
  is_approved: boolean;
  rejection_reason?: string;
  is_reserved: boolean;
  reserved_at?: Date;
  hasSettled: boolean;
  seller: Schema.Types.ObjectId;
  status: "approved" | "pending" | "rejected" | "flagged" | "removed";
  flags: {
    reason: string;
    flaggedBy: Types.ObjectId;
    date: Date;
  }[];
  sellerPhoneNumber: string,
}

// Interface for CartItem
export interface ICartItem extends Document {
  product: Types.ObjectId | (ProductListingType & { _id: Types.ObjectId });
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
  deliveryType: "pickup" | "delivery";
  deliveryAddress?: {
    location: string;
    landmark: string;
    primaryPhoneNumber: string;
    secondaryPhoneNumber?: string;
  };
  createdAt: Date;
  updatedAt: Date;
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
  role: "super_admin" | "admin" | "support_agent";
  emailVerified: boolean;
  otp?: string;
  otpExpires?: Date;
  is_admin: boolean;
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

export interface ITransaction extends Document {
  userId: string;
  amount: number;
  transactionDate: Date;
  status: string;
  charges?: number;
  transactionType: string;
  description?: string;
  referenceId?: string;
  refundRequest?: {
    reason: string;
    requestedBy: Schema.Types.ObjectId;
    requestedAt: Date;
    adminNotes?: string;
  };
  refundStatus?: "pending" | "approved" | "rejected" | "processed";
  refundDetails?: {
    paystackRefundId?: string;
    refundAmount?: number;
    processedAt?: Date;
    processedBy?: Schema.Types.ObjectId;
  };
  refundHistory?: Array<{
    action: string;
    performedBy: Schema.Types.ObjectId;
    performedAt: Date;
    notes?: string;
  }>;
  dispute?: boolean;
  totalAmount?: number;
  sellerEarnings?: number;
  revenue?: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface ISupportTicket extends Document {
  userId: Schema.Types.ObjectId;
  subject: string;
  issueType: "account" | "payment" | "orders" | "technical" | "others";
  assignedTo?: Schema.Types.ObjectId;
  assignedBy?: Schema.Types.ObjectId;
  assignmentMessage?: string;
  imageUrls?: string[];
  replies: {
    sender: Types.ObjectId;
    senderType: "Admin" | "User";
    message: string;
    createdAt: Date;
  }[];
  status: "open" | "in_progress" | "resolved" | "closed";
  adminNotes: {
    note: string;
    admin: Types.ObjectId;
    createdAt: Date;
  }[];
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAnnouncement extends Document {
  title: string;
  message: string;
  category: "Buyers" | "Sellers" | "All";
  createdBy: {
    id: Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IAnalyticsReport extends Document {
  activeUsers: number;
  inactiveUsers: number;
  expenses: number;
  revenue: number;
  commission: number;
  refundRequests: number;
  month: number
  year: number
  topProducts: {
    productId: string
    totalSales: number
    count: number
  }[]
  generatedAt: Date;
}

export interface ICategory  extends Document {
  name: string;
  description?: string;
}
export interface CreateNotificationData {
  recipient: Schema.Types.ObjectId | string;
  recipientModel: "User" | "Admin";
  body: string;
  type?: "account" | "market" | "promotion" | "refund";
  title: string;
}
