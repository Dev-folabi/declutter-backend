import { ProductListing } from './../types/model/index';
import { Product } from '../models/productList';
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { UserRequest } from "../types/requests";
import _ from "lodash";
import { getIdFromToken } from "../function/token"
import { User } from '../models/userModel';


export const getAllUnsoldProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
        
        const products = await Product.find({is_sold: false, is_approved: true})
        const productsData = _.map(products, (product) =>
            _.omit(product.toObject(), ["is_approved", "is_sold"]) // Replace with actual field names
          );
        res.status(200).json({
            success: true,
            message: products.length > 0 ? "Product retrieved successfully." : "No product listed at the moment",
            data: productsData,
        });
    } catch (error) {
      next(error);
    }
};

export const listAProduct = async (
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

        if (!(user?.role?.includes("seller"))){
            res.status(400).json({
                success: false,
                message: "User is not a seller.",
                data: null,
            });
        }

        const {
            name,
            category,
            price,
            location,
            description,
        } = req.body;

        const newProduct = await Product.create({
            name,
            price,
            category,
            location,
            description,
            seller: user?._id,
        });

        const productData = _.omit(newProduct.toObject(), ["is_sold"]);
      
        res.status(201).json({
            success: true,
            message: "Product listed successfully.",
            data: productData,
          });
        } catch (error) {
          next(error);
        }
};

export const updateAProduct = async (
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

        if (!(user?.role?.includes("seller"))){
            res.status(400).json({
                success: false,
                message: "User is not a seller.",
                data: null,
            });
        }
        
        const product = await Product.findById(req.params.id);

        if (!product){
            res.status(400).json({
                success: false,
                message: "Product not found.",
                data: null,
            });
        }

        if (product?.seller.toString() !== user?.id.toString()) {
            res.status(400).json({
                success: false,
                message: "You are not authorized to perform this action",
                data: null,
            });
        }
        
        req.body.is_approved = false;
        
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true },
        );
        
        const productData = _.omit(updatedProduct, ["is_sold"]);
        
        res.status(200).json({
            success: true,
            message: "Product updated successfully.",
            data: productData,
          });
        } catch (error) {
          next(error);
        }
};

export const getSingleUnsoldProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
        const product = await Product.findById(req.params.id)
        if (product){
            const productData = _.omit(product?.toObject(), ["is_approved"]);

            res.status(200).json({
                success: true,
                message: "Product retrieved successfully.",
                data: productData,
            });
        } else {
            res.status(400).json({
                success: false,
                message: "Product not found.",
                data: null,
            });
        }
        } catch (error) {
          next(error);
        }
};


