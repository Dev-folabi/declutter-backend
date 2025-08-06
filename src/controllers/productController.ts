import { Request, Response, NextFunction } from 'express';
import { ProductListingType } from './../types/model/index';
import { Product } from '../models/productList';
import _ from 'lodash';
import { getIdFromToken } from '../function/token';
import { User } from '../models/userModel';
// import { Admin } from '../models/adminModel';
import { createNotification } from './notificationController';
import { sendEmail } from '../utils/mail';

export const getAllUnsoldProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let query: any = { ...req.query };
    query.is_sold = false;
    query.is_approved = true;
    query.is_reserved = false;

    // Remove pagination fields
    delete query.page;
    delete query.limit;

    const search = req.query.search || '';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Add search functionality to query if there's a search term
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } }, // Search by product name (case insensitive)
        { category: { $regex: search, $options: 'i' } }, // Search by category (case insensitive)
        { description: { $regex: search, $options: 'i' } }, // Search by description (case insensitive)
      ];
    }

    // Remove search from query as it's not a field in the document
    delete query.search;

    const products = await Product.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
    // const products = await Product.find({is_sold: false, is_approved: true})
    const productsData = _.map(products, (product) =>
      _.omit(product.toObject(), ['is_approved', 'is_sold'])
    );
    res.status(200).json({
      success: true,
      message:
        products.length > 0 ? 'Product retrieved successfully.' : 'No product listed at the moment',
      data: productsData,
    });
  } catch (error) {
    next(error);
  }
};

export const listAProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(getIdFromToken(req));

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Unauthenticated user cannot list a product.',
        data: null,
      });
    }

    if (!user?.role?.includes('seller')) {
      res.status(400).json({
        success: false,
        message: 'User is not a seller.',
        data: null,
      });
    }

    const { name, category, price, productImage, location, description } = req.body;

    if (productImage.length < 3) {
      res.status(400).json({
        success: false,
        message: 'At least three product images are required.',
        data: null,
      });
      return;
    }

    const productId = () => {
      return `DM-${Date.now()}`;
    };
    const newProduct = await Product.create({
      name,
      price,
      productId: productId(),
      category,
      location,
      description,
      seller: user?._id,
      productImage,
    });

    const productData = _.omit(newProduct.toObject(), ['is_sold']);

    const notificationData = {
      user: user?._id,
      body: 'Your product listing has been successfully submitted and is now pending review by the admin.',
      type: 'market',
      title: 'Product Listing Notification',
    };

    Promise.allSettled([
      createNotification(notificationData),
      sendEmail(
        user?.email!,
        'Product Listing Notification',
        'Your product listing has been successfully submitted and is now pending review by the admin.'
      ),
    ]);

    res.status(201).json({
      success: true,
      message: 'Product listed successfully.',
      data: productData,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(getIdFromToken(req));

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Unauthenticated user cannot list a product.',
        data: null,
      });
    }

    if (!user?.role?.includes('seller')) {
      res.status(400).json({
        success: false,
        message: 'User is not a seller.',
        data: null,
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(400).json({
        success: false,
        message: 'Product not found.',
        data: null,
      });
    }

    if (product?.seller.toString() !== user?.id.toString()) {
      res.status(400).json({
        success: false,
        message: 'You are not authorized to perform this action',
        data: null,
      });
    }

    req.body.is_approved = false;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    const productData = _.omit(updatedProduct, ['is_sold']);

    const notificationData = {
      user: user?._id,
      body: 'Product has been updated. It is awaiting review by the admin',
      type: 'market',
      title: 'Product Updated',
    };

    await createNotification(notificationData);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: productData,
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleUnsoldProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      const productData = _.omit(product?.toObject(), ['is_approved']);

      res.status(200).json({
        success: true,
        message: 'Product retrieved successfully.',
        data: productData,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Product not found.',
        data: null,
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getUnsoldProductsByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let query: any = { ...req.query };
    query.is_sold = false;
    query.is_approved = true;
    query.is_reserved = false;
    query.category = req.params.category;

    // Remove pagination fields
    delete query.page;
    delete query.limit;

    const search = req.query.search || '';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Add search functionality to query if there's a search term
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } }, // Search by product name (case insensitive)
        { category: { $regex: search, $options: 'i' } }, // Search by category (case insensitive)
        { description: { $regex: search, $options: 'i' } }, // Search by description (case insensitive)
      ];
    }

    // Remove search from query as it's not a field in the document
    delete query.search;

    const products = await Product.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
    if (products) {
      const productsData = _.map(products, (product) =>
        _.omit(product.toObject(), ['is_approved', 'is_sold'])
      );
      res.status(200).json({
        success: true,
        message:
          products.length > 0
            ? 'Product retrieved successfully.'
            : 'No product listed at the moment',
        data: productsData,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Product not found.',
        data: null,
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getAllLongUnsoldProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let query: any = { ...req.query };
    query.is_sold = false;
    query.is_approved = true;

    // Remove pagination fields
    delete query.page;
    delete query.limit;

    const search = req.query.search || '';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Add search functionality to query if there's a search term
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } }, // Search by product name (case insensitive)
        { category: { $regex: search, $options: 'i' } }, // Search by category (case insensitive)
        { description: { $regex: search, $options: 'i' } }, // Search by description (case insensitive)
      ];
    }

    // Remove search from query as it's not a field in the document
    delete query.search;

    const products = await Product.find(query).skip(skip).limit(limit).sort({ createdAt: 1 });
    // const products = await Product.find({is_sold: false, is_approved: true})
    const productsData = _.map(products, (product) =>
      _.omit(product.toObject(), ['is_approved', 'is_sold'])
    );
    res.status(200).json({
      success: true,
      message:
        products.length > 0 ? 'Product retrieved successfully.' : 'No product listed at the moment',
      data: productsData,
    });
  } catch (error) {
    next(error);
  }
};
