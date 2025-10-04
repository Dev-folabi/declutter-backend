import { Request, Response, NextFunction } from "express";
import { getIdFromToken } from "../function/token";
import { User } from "../models/userModel";
import { Cart } from "../models/cart";
import { Product } from "../models/productList";
import { ICartItem } from "../types/model/index";
import { handleError } from "../error/errorHandler";

/** Utility to get or create a cart */
const getOrCreateCart = async (userId: string) => {
  let cart = await Cart.findOne({ user: userId }).populate(
    "items.product",
    "name productImage"
  );
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [], totalPrice: 0 });
  }
  return cart;
};

export const getUserCart = async (
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
        message: "Unauthorized. Please log in.",
        data: null,
      });
      return;
    }

    const cart = await getOrCreateCart(user._id as string);

    res.status(200).json({
      success: true,
      message: "Cart retrieved successfully.",
      data: cart,
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
      res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in.",
        data: null,
      });
      return;
    }

    const { product_id, quantity = 1 } = req.body;
    if (quantity <= 0) {
      handleError(res, 400, "Quantity must be greater than 0.");
      return;
    }

    const product = await Product.findOne({
      _id: product_id,
      quantity: { $gt: 0 },
      is_approved: true,
      is_reserved: false,
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found or unavailable.",
        data: null,
      });
      return;
    }

    if (product.quantity < quantity) {
      handleError(
        res,
        400,
        `Not enough items in stock. Only ${product.quantity} available.`
      );
      return;
    }

    if (product.seller.toString() === userId) {
      handleError(res, 400, "You can't buy your own product");
      return;
    }

    let cart = await Cart.findOne({ user: user._id });
    if (!cart) {
      cart = await Cart.create({ user: user._id, items: [], totalPrice: 0 });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === (product._id as any).toString()
    );

    const totalItemPrice = quantity * Number(product.price);

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity;
      cart.items[existingIndex].price += totalItemPrice;
    } else {
      cart.items.push({
        product: product._id,
        quantity,
        price: totalItemPrice,
      } as ICartItem);
    }

    cart.totalPrice += totalItemPrice;

    cart.markModified("items");
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

export const removeItemFromCart = async (
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
        message: "Unauthorized. Please log in.",
        data: null,
      });
      return;
    }

    const { product_id } = req.params;

    const cart = await Cart.findOne({ user: user._id }).populate(
      "items.product"
    );
    if (!cart || cart.items.length === 0) {
      handleError(res, 404, "Cart is empty");
      return;
    }

    const product = await Product.findById(product_id);
    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found.",
        data: null,
      });
      return;
    }

    // Find item index
    const itemIndex = cart.items.findIndex((item) => {
      const prodId = item.product._id ? item.product._id : item.product;
      return prodId.toString() === product_id.toString();
    });

    if (itemIndex === -1) {
      res.status(404).json({
        success: false,
        message: "Item not found in the cart.",
        data: null,
      });
      return;
    }

    // If quantity > 1, decrement. Else, remove.
    if (cart.items[itemIndex].quantity > 1) {
      cart.items[itemIndex].quantity -= 1;
      cart.items[itemIndex].price -= Number(product.price);
    } else {
      cart.items.splice(itemIndex, 1);
    }

    // Recalculate total
    cart.totalPrice = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    cart.markModified("items");
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Item updated in cart successfully.",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

//  This controller has been deprecated. Add and Remove cart endpoint should be use instead.
// export const updateCartItem = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = getIdFromToken(req);
//     const user = await User.findById(userId);
//     if (!user) {
//       res.status(401).json({
//         success: false,
//         message: "Unauthorized. Please log in.",
//         data: null,
//       });
//       return;
//     }

//     const { product_id, quantity } = req.body;

//     if (!product_id || !Number.isInteger(quantity) || quantity < 1) {
//       res.status(400).json({
//         success: false,
//         message: "Valid product_id and quantity (integer >= 1) are required.",
//         data: null,
//       });
//       return;
//     }

//     const product = await Product.findOne({
//       _id: product_id,
//       is_approved: true,
//     });

//     if (!product) {
//       res.status(404).json({
//         success: false,
//         message: "Product not found or unavailable.",
//         data: null,
//       });
//       return;
//     }

//     if (product.quantity < quantity) {
//       return handleError(
//         res,
//         400,
//         `Not enough items in stock. Only ${product.quantity} available.`
//       );
//     }

//     const cart = await Cart.findOne({ user: user._id });
//     if (!cart || cart.items.length === 0) {
//       res.status(404).json({
//         success: false,
//         message: "Cart is empty.",
//         data: null,
//       });
//       return;
//     }

//     const itemIndex = cart.items.findIndex(
//       (item) => item.product.toString() === (product._id as any).toString()
//     );

//     if (itemIndex === -1) {
//       res.status(404).json({
//         success: false,
//         message: "Product not found in cart.",
//         data: null,
//       });
//       return;
//     }
//     cart.items[itemIndex].quantity = quantity;
//     cart.items[itemIndex].price = quantity * Number(product.price);

//     cart.totalPrice = cart.items.reduce((sum, item) => sum + item.price, 0);
//     await cart.save();

//     res.status(200).json({
//       success: true,
//       message: "Cart item updated successfully.",
//       data: cart,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
