import { Request, Response, NextFunction } from "express";
import { Product } from "../models/productList";
import _ from "lodash";
import { getIdFromToken } from "../function/token";
import { User } from "../models/userModel";
import { createNotification } from "./notificationController";
import { Order } from "../models/order";
import { Cart } from "../models/cart";
import { CreateNotificationData } from "../types/model";
import { Logistics } from "../models/logisticModel";
import { Admin } from "../models/adminModel";
import { sendEmail } from "../utils/mail";

export const orderCheckout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { deliveryType, deliveryAddress } = req.body;
    const userId = getIdFromToken(req);
    const user = await User.findById(userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user cannot create an order.",
        data: null,
      });
      return;
    }

    const cart = await Cart.findOne({ user: user._id });

    if (!cart || cart.items.length === 0) {
      res.status(400).json({
        success: false,
        message: "Cart is empty.",
        data: null,
      });
      return;
    }

    const orderItems = [];
    let totalOrderPrice = 0;
    const unavailableItems: string[] = [];

    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.product);

      if (
        !product ||
        !product.is_approved ||
        product.quantity < cartItem.quantity
      ) {
        if (product) {
          unavailableItems.push(product.name);
        } else {
          unavailableItems.push(`An unknown item`);
        }
        continue;
      }

      const itemTotal = cartItem.quantity * Number(product.price);
      totalOrderPrice += itemTotal;

      orderItems.push({
        product: product._id,
        quantity: cartItem.quantity,
        price: itemTotal,
      });
    }

    if (unavailableItems.length > 0) {
      res.status(400).json({
        success: false,
        message: `Some items in your cart are unavailable or don't have enough stock: ${unavailableItems.join(
          ", "
        )}. Please adjust your cart.`,
      });
      return;
    }

    // Create the order
    const orderData: any = {
      user: user._id,
      items: orderItems,
      totalPrice: totalOrderPrice,
      deliveryType,
    };

    if (deliveryType === "delivery") {
      orderData.deliveryAddress = deliveryAddress;
    }

    const order = await Order.create(orderData);


    // Create notification
    const notificationData: CreateNotificationData = {
      recipient: user._id as string,
      recipientModel: "User" as const,
      body: "Order created successfully, awaiting payment",
      type: "market",
      title: "Order Created",
    };

    await createNotification(notificationData);

    res.status(201).json({
      success: true,
      message: "Order created successfully.",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = getIdFromToken(req);
    const user = await User.findById(userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "You need to be authenticated to perform this action.",
        data: null,
      });
      return;
    }

    const orders = await Order.find({ user: user._id })
      .populate("items.product", "name productImage productType")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Orders retrieved successfully.",
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderItems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(getIdFromToken(req));
    if (!user) {
      res.status(400).json({
        success: false,
        message: "You need to be authenticated to perform this action.",
        data: null,
      });
      return;
    }

    const { order_id } = req.params;

    const order = await Order.findOne({
      _id: order_id,
      user: user._id,
    }).populate("items.product", "name productImage productType");

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found or you do not have access to this order.",
        data: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Order items retrieved successfully.",
      data: order.items,
    });
  } catch (error) {
    next(error);
  }
};

export const OrderAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
      const { orderId } = req.params;
      const {isAvailable } = req.body
      const user =  await User.findById(getIdFromToken(req))
      
      if (!user) {
          res.status(401).json({
              success: false,
              message: "Unauthenticated user cannot perform this action.",
              data: null
          })
          return
      }

      // only sellers with approved status can perform this action
      if (user.role.includes("seller") && !user.sellerStatus.includes("approved")) {
         res.status(400).json({
              success: false,
              messsage: "Unapproved seller cannnot perform this action",
              data: null
         })
         return
      }
      
      // check if order exists
      const order = await Order.findById(orderId);
      if(!order || !order.status.includes("paid") ) {
        res.status(400).json({
          success: false,
          message: "Invalid order or payment not completed.",
          data: null
        })
        return
      }
      // || !order.status.includes("paid")
      
      let logistics = await Logistics.findOne({order: order._id})
      // create logistics if not exist
      if (!logistics) {
        logistics = new Logistics({
          order: order?._id,
          status: "ready_for_pickup"
        })
      }
      if (isAvailable === true) {
          logistics.status = "ready_for_pickup"
      } else if (isAvailable === false) {
          logistics.status = "cancelled"
      }
      await logistics.save();
      // Notify the logistic agents and the admin 
      const allowedAdmin = await Admin.find({role: {$in: ["logistics_agent", "super_admin"]}}).select("_id email");

      if ( allowedAdmin.length === 0) {
          res.status(400).json({
              success: false,
              message: "No logistics agents or admins found to notify.",
              data: null
          })
          return
      }

      for (const admin of allowedAdmin) {
          const notificationData: CreateNotificationData = {
              recipient: admin._id as string,
              recipientModel: "Admin" as const,
              body: `Order ${order._id} is marked as ${logistics.status}`,
              type: "market",
              title: "Order Availability Update",
          }
          await createNotification(notificationData);
          // send email 
          await sendEmail(
              admin.email,
               "Order Availability Update",
               `The order with ID ${order._id} has been marked as ${
                isAvailable ? "available" : "unavailable"
              } by the seller.`
          )
      }

      res.status(200).json({
          success: true,
          message: "Order availability confirmed and  updated successfully",
          data: logistics
      })
     
  } catch (error) {
      next(error)
  }
}
