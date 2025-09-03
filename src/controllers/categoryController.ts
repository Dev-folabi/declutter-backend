import { Request, Response, NextFunction } from "express";
import { User } from "../models/userModel";
import { Category } from "../models/category";
import { getIdFromToken } from "../function/token";
import { Admin } from "../models/adminModel";

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {name, description} = req.body;
        const adminId = getIdFromToken(req);
        const admin = await Admin.findById(adminId);
        if (!admin) {
            res.status(401).json({
                success: false,
                message: "You are not authorized to perform this action",
                data: null
            });
            return;
        }
        // prevent duplicate category names
        const existingCategory = await Category.findOne({name});
        if (existingCategory) {
            res.status(400).json({
                success: false,
                message: "Category with this name already exists",
                data: null
            });
            return;
        }
        const category = await Category.create({
            name,
            description,
            createdBy: admin._id
        });
        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category
        });

    } catch (error) {
        next(error);
    }
}

//  Get category for user 
export const getCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = await Category.find().sort({createdAt: -1});
        res.status(200).json({
            success: true,
            message: "Categories retrieved successfully",
            data: categories
        });
    } catch (error) {
        next(error);
    }
}    