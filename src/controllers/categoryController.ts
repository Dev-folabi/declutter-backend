import { Request, Response, NextFunction } from "express";
import { Category } from "../models/category";
import { getIdFromToken } from "../function/token";
import { Admin } from "../models/adminModel";
import { Product } from "../models/productList";

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description } = req.body;
    const adminId = getIdFromToken(req);
    const admin = await Admin.findById(adminId);
    if (!admin) {
      res.status(401).json({
        success: false,
        message: "You are not authorized to perform this action",
        data: null,
      });
      return;
    }

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      res.status(400).json({
        success: false,
        message: "Category with this name already exists",
        data: null,
      });
      return;
    }
    const category = await Category.create({
      name,
      description,
      createdBy: admin._id,
    });
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

//  Get category for user
export const getCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: "Categories retrieved successfully",
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categoryId } = req.params;
    const { name, description } = req.body;

    const category = await Category.findById(categoryId);

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      })
      return;
    }

    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        res.status(400).json({
          success: false,
          message: "A category with this name already exists.",
        })
        return;
      }
      category.name = name;
    }

    if (description) {
      category.description = description;
    }

    const updatedCategory = await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categoryId } = req.params;

    const productCount = await Product.countDocuments({ category: categoryId });

    if (productCount > 0) {
      res.status(400).json({
        success: false,
        message:
          "Cannot delete category as it is associated with existing products.",
      })
      return;
    }

    const category = await Category.findByIdAndDelete(categoryId);

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      })
      return;
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};