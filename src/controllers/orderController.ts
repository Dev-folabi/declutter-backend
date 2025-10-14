import { Request, Response, NextFunction } from "express";
import { Product } from "../models/productList";
import _ from "lodash";
import { getIdFromToken } from "../function/token";
import { User } from "../models/userModel";
import { createNotification } from "./notificationController";
import { Order } from "../models/order";
import { Cart } from "../models/cart";
import { CreateNotificationData } from "../types/model";

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
      .populate("items.product", "name productImage") // Select key product fields
      .populate("transaction", "transactionId") // Populate transactionId
      .sort({ createdAt: -1 }); // Most recent first

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
    }).populate("items.product", "name productImage");

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
