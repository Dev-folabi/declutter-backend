import { ICartItem } from "./../types/model/index";
import { Product } from "../models/productList";
import { Request, Response, NextFunction } from "express";
import _ from "lodash";
import { getIdFromToken } from "../function/token";
import { User } from "../models/userModel";
import { Cart } from "../models/cart";

export const getUserCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(getIdFromToken(req));

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Unauthenticated user cannot list a product.",
        data: null,
      });
    }
    let cart = await Cart.findOne({ user: user?._id });
    if (!cart) {
      cart = await Cart.create({
        user: user?._id,
        items: [],
        totalPrice: 0,
      });
    }

    res.status(200).json({
      success: true,
      message: "Cart retrieved successfully.",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const removeItemFromCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(getIdFromToken(req));

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Unauthenticated user cannot list a product.",
        data: null,
      });
    }
    const { product_id } = req.params;

    let cart = await Cart.findOne({ user: user?._id });
    if (!cart) {
      cart = await Cart.create({
        user: user?._id,
        totalPrice: 0,
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === product_id
    );
    if (itemIndex === -1) {
      res.status(404).json({
        success: false,
        message: "Item not found in the cart.",
        data: null,
      });
      return;
    }
    cart.items.splice(itemIndex, 1);
    const updatedCart = await cart.save();

    res.status(200).json({
      success: true,
      message: "Item has been removed from your cart successfully.",
      data: updatedCart,
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = getIdFromToken(req);
    const user = await User.findById(userId);

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Unauthenticated user cannot list a product.",
        data: null,
      });
      return;
    }

    const { product_id, quantity } = req.body;

    const product = await Product.findOne({
      _id: product_id,
      is_sold: false,
      is_approved: true,
      is_reserved: false,
    });

    if (!product) {
      res.status(400).json({
        success: false,
        message: "Product not found.",
        data: null,
      });
      return;
    }

    let cart = await Cart.findOne({ user: user._id });

    if (!cart) {
      cart = new Cart({
        user: user._id,
        items: [],
        totalPrice: 0,
      });
    }
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === (product._id as string)
    );

    const qtyToAdd = quantity || 1;
    const totalItemPrice = Number(product.price) * qtyToAdd;

    if (existingItemIndex > -1) {
      // Update existing item
      cart.items[existingItemIndex].quantity += qtyToAdd;
      cart.items[existingItemIndex].price += totalItemPrice;
    } else {
      // Add new item
      cart.items.push({
        product: product._id,
        quantity: qtyToAdd,
        price: totalItemPrice,
      } as ICartItem);
    }

    cart.totalPrice += totalItemPrice;

    await cart.save();

    res.status(201).json({
      success: true,
      message: "Product added to cart successfully.",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = getIdFromToken(req);
    const user = await User.findById(userId);

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Unauthenticated user cannot update a cart item.",
        data: null,
      });
      return;
    }

    const { product_id, quantity } = req.body;

    if (!product_id || !quantity || quantity < 1) {
      res.status(400).json({
        success: false,
        message: "Product ID and a valid quantity are required.",
        data: null,
      });
      return;
    }

    const product = await Product.findOne({
      _id: product_id,
      is_sold: false,
      is_approved: true,
    });

    if (!product) {
      res.status(400).json({
        success: false,
        message: "Product not found.",
        data: null,
      });
      return;
    }

    const cart = await Cart.findOne({ user: user._id });

    if (!cart) {
      res.status(404).json({
        success: false,
        message: "Cart not found.",
        data: null,
      });
      return;
    }
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === (product as any)._id.toString()
    );

    if (itemIndex === -1) {
      res.status(400).json({
        success: false,
        message: "Can't find the product in your cart.",
        data: null,
      });
      return;
    }

    // Calculate total price from scratch
    let newTotalPrice = 0;

    // Update the quantity and price of the item
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = quantity * Number(product.price);

    // Recalculate total cart price
    cart.items.forEach((item) => {
      newTotalPrice += item.price;
    });

    cart.totalPrice = newTotalPrice;
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart item updated successfully.",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};
