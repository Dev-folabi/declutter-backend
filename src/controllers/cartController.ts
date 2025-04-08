import { ICart, ICartItem } from './../types/model/index';
import { Product } from '../models/productList';
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { UserRequest } from "../types/requests";
import _ from "lodash";
import { getIdFromToken } from "../function/token"
import { User } from '../models/userModel';
import { createNotification } from './notificationController';
import { Cart, CartItem } from '../models/cart';
import { Order, OrderItem } from '../models/order';


export const getUserCart = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
        
        const user = await User.findById(getIdFromToken(req))

        if (!user){
            res.status(400).json({
                success: false,
                message: "Unauthenticated user cannot list a product.",
                data: null,
            });
        }
        let cart = await Cart.findOne({user: user?._id});
        if (!cart) {
            cart = await Cart.create({
                user: user?._id,
                totalPrice: 0,
            });
        }
        let cartItem = await CartItem.find({cart: cart?._id});
        

        // const productsData = _.map(products, (product) =>
        //     _.omit(product.toObject(), ["is_approved", "is_sold"]) 
        //   );
        res.status(200).json({
            success: true,
            message: "Cart retrieved successfully.",
            data: cartItem,
        });
    } catch (error) {
      next(error);
    }
};

export const orderCheckout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
        const user = await User.findById(getIdFromToken(req))

        if (!user){
            res.status(400).json({
                success: false,
                message: "Unauthenticated user cannot list a product.",
                data: null,
            });
        }

        let cart = await Cart.findOne({user: user?._id});
        if (!cart) {
            cart = await Cart.create({
                user: user?._id,
                totalPrice: 0,
            });
        }
        let cartItem = await CartItem.find({cart: cart?._id});

        if (!cartItem) {
            res.status(400).json({
                success: false,
                message: "Cart is empty.",
                data: null,
            });
        }

        const order = await Order.create({user: user?._id})
        for (let i = 0; i < cartItem?.length; i++) {

            const product = await Product.findById(cartItem[i]?.product);
            if (product) {
                await OrderItem.create({
                    order: order?._id,
                    product : product?._id,
                    quantity : cartItem[i]?.quantity,
                    price : product?.price * cartItem[i]?.quantity
                })

                
                // Update product using updateOne to avoid validation issues
                await Product.updateOne({ _id: product._id }, { is_reserved: true });

                // product.is_sold = true;

                await CartItem.deleteOne({cart: cartItem[i]?._id, product: product?._id})
            }
        }

        // create payment here and probably return the payment link

        const notificationData = {
            user: user?._id,
            body: "Order created successfully, awaiting payment",
            type: "market",
            title: "Product Create",
            // order: order
        }

        await createNotification(notificationData)
        res.status(201).json({
            success: true,
            message: "Order created successfully.",
            data: order,
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

        const user = await User.findById(getIdFromToken(req))

        if (!user){
            res.status(400).json({
                success: false,
                message: "Unauthenticated user cannot list a product.",
                data: null,
            });
        }
        const { product_id} = req.params

        let cart = await Cart.findOne({user: user?._id});
        if (!cart) {
            cart = await Cart.create({
                user: user?._id,
                totalPrice: 0,
            });
        }
        let cartItem = await CartItem.findOneAndDelete({cart: cart?._id, product: product_id});
        if (!cartItem){
            res.status(400).json({
                success: false,
                message: "Product does not exit in your cart.",
                data: null,
            });
        }
     
        
        const notificationData = {
            user: user?._id,
            body: "Product has been updated. It is awaiting review by the admin",
            type: "market",
            title: "Product Updated"
        }

        await createNotification(notificationData)

        res.status(200).json({
            success: true,
            message: "Item has been removed from your cart successfully.",
            data: {},
          });
        } catch (error) {
          next(error);
        }
};


export const addToCart = async (
            req: Request,
            res: Response,
            next: NextFunction
        )=> {
    try {
        const user = await User.findById(getIdFromToken(req))

        if (!user){
            res.status(400).json({
                success: false,
                message: "Unauthenticated user cannot list a product.",
                data: null,
            });
        }

        const {
            product_id,
            quantity
        } = req.body;

        
        const product = await Product.findOne({_id: product_id, is_sold: false, is_approved: true})
        
        if (!product){
            res.status(400).json({
                success: false,
                message: "Product not found.",
                data: null,
            });
        }
        let cart = await Cart.findOne({user: user?._id});
        if (!cart) {
            cart = await Cart.create({
                user: user?._id,
                totalPrice: 0,
            });
        }
        let cartItem = await CartItem.findOne({product: product?._id, cart: cart?._id});
        
        if (cartItem) {
            cartItem.quantity += 1;
            cartItem.price += Number(product?.price || 0);
            await cartItem.save();
        } else {
            
            cartItem = await CartItem.create({
                product: product_id,
                cart: cart?._id,
                quantity: quantity || 1,
                price: Number(product?.price || 0),
            })
        }
        

        cart.totalPrice += Number(product?.price || 0);
        await cart.save();

        res.status(201).json({
            success: true,
            message: "Product added to cart successfully.",
            data: cart,
        });


    } catch (error) {
        next(error);
    }

}

export const updateCartItem = async (
            req: Request,
            res: Response,
            next: NextFunction
        )=> {
    try {
        const user = await User.findById(getIdFromToken(req))

        if (!user){
            res.status(400).json({
                success: false,
                message: "Unauthenticated user cannot list a product.",
                data: null,
            });
        }

        const {
            product_id,
            quantity
        } = req.body;

        const product = await Product.findOne({_id: product_id, is_sold: false, is_approved: true})
        if (!product){
            res.status(400).json({
                success: false,
                message: "Product not found.",
                data: null,
            });
        }
        let cart = await Cart.findOne({user: user?._id});
        if (!cart) {
            cart = await Cart.create({
                user: user?._id,
                totalPrice: 0,
            });
        }
        let cartItem = await CartItem.findOne({product: product?._id, cart: cart?._id});
        if (cartItem) {
            cartItem.quantity = quantity;
            cartItem.price = (product?.price ?? 0) * quantity;
            await cartItem.save();
        } else {
            res.status(400).json({
                success: false,
                message: "Cant find the product in your cart.",
                data: null,
            });
        }

        cart.totalPrice += Number(product?.price || 0);
        await cart.save();

        res.status(201).json({
            success: true,
            message: "Product added to cart successfully.",
            data: cart,
        });


    } catch (error) {
        next(error);
    }

}
