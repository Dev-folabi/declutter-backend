import { ICart, ICartItem } from "./../types/model/index";
import { Product } from "../models/productList";
import { Request, Response, NextFunction } from "express";
import _ from "lodash";
import { getIdFromToken } from "../function/token";
import { User } from "../models/userModel";
import { createNotification } from "./notificationController";
import { Cart } from "../models/cart";
import { Order, OrderItem } from "../models/order";

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

// export const orderCheckout = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const user = await User.findById(getIdFromToken(req));

//     if (!user) {
//       res.status(400).json({
//         success: false,
//         message: "Unauthenticated user cannot list a product.",
//         data: null,
//       });
//     }

//     let cart = await Cart.findOne({ user: user?._id });
//     if (!cart) {
//       cart = await Cart.create({
//         user: user?._id,
//         totalPrice: 0,
//       });
//     }
//     let cartItem = await CartItem.find({ cart: cart?._id });

//     if (!cartItem) {
//       res.status(400).json({
//         success: false,
//         message: "Cart is empty.",
//         data: null,
//       });
//     }

//     const order = await Order.create({ user: user?._id });
//     for (let i = 0; i < cartItem?.length; i++) {
//       const product = await Product.findById(cartItem[i]?.product);
//       if (product) {
//         await OrderItem.create({
//           order: order?._id,
//           product: product?._id,
//           quantity: cartItem[i]?.quantity,
//           price: product?.price * cartItem[i]?.quantity,
//         });

//         // Update product using updateOne to avoid validation issues
//         await Product.updateOne({ _id: product._id }, { is_reserved: true });

//         // product.is_sold = true;

//         await CartItem.deleteOne({
//           cart: cartItem[i]?._id,
//           product: product?._id,
//         });
//       }
//     }

//     // create payment here and probably return the payment link

//     const notificationData = {
//       user: user?._id,
//       body: "Order created successfully, awaiting payment",
//       type: "market",
//       title: "Product Create",
//       // order: order
//     };

//     await createNotification(notificationData);
//     res.status(201).json({
//       success: true,
//       message: "Order created successfully.",
//       data: order,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

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
      return res.status(404).json({
        success: false,
        message: "Item not found in the cart.",
        data: null,
      });
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
        return res.status(400).json({
          success: false,
          message: "Unauthenticated user cannot list a product.",
          data: null,
        });
      }
  
      const { product_id, quantity } = req.body;
  
      const product = await Product.findOne({
        _id: product_id,
        is_sold: false,
        is_approved: true,
        is_reserved: false,
      });
  
      if (!product) {
        return res.status(400).json({
          success: false,
          message: "Product not found.",
          data: null,
        });
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
  
      return res.status(201).json({
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
        return res.status(400).json({
          success: false,
          message: "Unauthenticated user cannot update a cart item.",
          data: null,
        });
      }
  
      const { product_id, quantity } = req.body;
  
      if (!product_id || !quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Product ID and a valid quantity are required.",
          data: null,
        });
      }
  
      const product = await Product.findOne({
        _id: product_id,
        is_sold: false,
        is_approved: true,
      });
  
      if (!product) {
        return res.status(400).json({
          success: false,
          message: "Product not found.",
          data: null,
        });
      }
  
      const cart = await Cart.findOne({ user: user._id });
  
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found.",
          data: null,
        });
      }
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === (product as any)._id.toString()
      );
  
      if (itemIndex === -1) {
        return res.status(400).json({
          success: false,
          message: "Can't find the product in your cart.",
          data: null,
        });
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
  
      return res.status(200).json({
        success: true,
        message: "Cart item updated successfully.",
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  };
