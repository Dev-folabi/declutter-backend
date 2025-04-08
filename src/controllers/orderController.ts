import { ICart, ICartItem } from './../types/model/index';
import { Product } from '../models/productList';
import { Request, Response, NextFunction } from "express";
import _ from "lodash";
import { getIdFromToken } from "../function/token"
import { User } from '../models/userModel';
import { createNotification } from './notificationController';
import { Order, OrderItem } from '../models/order';


export const getUserOrders = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
        
        const user = await User.findById(getIdFromToken(req))

        if (!user){
            res.status(400).json({
                success: false,
                message: "You need to be authenticated to perform this action.",
                data: null,
            });
        }
        let order = await Order.find({user: user?._id});
        
        // let orderItem = await OrderItem.find({order: order?._id});
        

        // const productsData = _.map(products, (product) =>
        //     _.omit(product.toObject(), ["is_approved", "is_sold"]) 
        //   );
        res.status(200).json({
            success: true,
            message: "Orders retrieved successfully.",
            data: order,
        });
    } catch (error) {
      next(error);
    }
};


export const getOrderItemsForanOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
        
        const user = await User.findById(getIdFromToken(req))

        if (!user){
            res.status(400).json({
                success: false,
                message: "You need to be authenticated to perform this action.",
                data: null,
            });
        }

        const {order_id} = req.params;
        let order = await Order.findOne({_id: order_id, user: user?._id});
        
        if (!order) {
            res.status(404).json({
                success: false,
                message: "Order not found or you do not have access to this order.",
                data: null,
            });
        }
        let orderItem = await OrderItem.find({order: order_id});
        

        // const productsData = _.map(products, (product) =>
        //     _.omit(product.toObject(), ["is_approved", "is_sold"]) 
        //   );
        res.status(200).json({
            success: true,
            message: "Orders retrieved successfully.",
            data: orderItem,
        });
    } catch (error) {
      next(error);
    }
};
