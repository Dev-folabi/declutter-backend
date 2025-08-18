import { Request, Response, NextFunction } from "express";
import { Product } from "../models/productList";
import _ from "lodash";
import { getIdFromToken } from "../function/token";
import { User } from "../models/userModel";
import { createNotification } from "./notificationController";
import { Order } from "../models/order";
import { Cart } from "../models/cart";

export const orderCheckout = async (
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

    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.product);

      if (!product || product.is_sold || !product.is_approved) {
        continue; // skip invalid products
      }

      const itemTotal = cartItem.quantity * Number(product.price);
      totalOrderPrice += itemTotal;

      orderItems.push({
        product: product._id,
        quantity: cartItem.quantity,
        price: itemTotal,
      });

      // Mark product as reserved
      await Product.updateOne({ _id: product._id }, { is_reserved: true });
    }

    // Create the order
    const order = await Order.create({
      user: user._id,
      items: orderItems,
      totalPrice: totalOrderPrice,
    });

    // Clear the cart
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    // Create notification
    const notificationData = {
      recipient: user._id,
      recipientModel: "User",
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
