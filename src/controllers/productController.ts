import { ProductListing } from './../types/model/index';
import { Product } from '../models/productList';
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { UserRequest } from "../types/requests";
import _ from "lodash";
import { getIdFromToken } from "../function/token"


export const getAllUnsoldProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      
        const products = await Product.find({is_sold: true, is_approved: true})
        if (products){
            res.status(200).json({
                success: true,
                message: "Product retrieved successfully.",
                data: products,
            });
        } else {
            res.status(400).json({
                success: false,
                message: "Product not found.",
                data: [],
            });
        }
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

        req.body.is_approved = false
        
        const product = await Product.updateOne({ _id: req.params.id }, { $set: req.body });
        const productData = _.omit(product, ["is_sold"]);
        
        res.status(201).json({
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


