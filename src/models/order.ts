import mongoose, { Schema, Document } from 'mongoose';
import { IOrder, IOrderItem } from '../types/model';



// Schema for OrderItem
const OrderItemSchema: Schema = new Schema(
    {
        product: { 
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        order: { 
            type: Schema.Types.ObjectId,
            ref: 'order',
            required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 }
    },
    { timestamps: true }
);



// Schema for Order
const OrderSchema: Schema = new Schema(
    {
        user: { 
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // items: { type: [OrderItemSchema], required: true },
        totalPrice: { type: Number, required: false, min: 0 },
    },
    { timestamps: true }
);

// Models
export const OrderItem = mongoose.model<IOrderItem>('OrderItem', OrderItemSchema);
export const Order = mongoose.model<IOrder>('Order', OrderSchema);