import { Request, Response, NextFunction } from "express";
import { Product } from "../models/productList";
import _ from "lodash";
import { getIdFromToken } from "../function/token";
import { User } from "../models/userModel";
import { createNotification } from "./notificationController";
import { sendEmail } from "../utils/mail";
import { uploadMultipleToImageKit } from "../utils/imagekit";
import { paginated_result } from "../utils/pagination";
import { Category } from "../models/category";
import { CreateNotificationData } from "../types/model";
import { Admin } from "../models/adminModel";

export const getAllUnsoldProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let query: any = { ...req.query };
    query.quantity = { $gt: 0 };
    query.is_approved = true;
    query.is_reserved = false;

    // Price range filter
    if (req.query.minPrice) {
      query.price = { ...query.price, $gte: Number(req.query.minPrice) };
    }
    if (req.query.maxPrice) {
      query.price = { ...query.price, $lte: Number(req.query.maxPrice) };
    }

    // Remove pagination and price fields from query
    delete query.page;
    delete query.limit;
    delete query.minPrice;
    delete query.maxPrice;

    const search = req.query.search || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Add search functionality to query if there's a search term
    if (search) {
      const categories = await Category.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");
      const categoryIds = categories.map((c) => c._id);
      query.$or = [
        { name: { $regex: search, $options: "i" } }, // Search by product name (case insensitive)
        { description: { $regex: search, $options: "i" } }, // Search by description (case insensitive)
        { category: { $in: categoryIds } }, // Search by category IDs
      ];
    }

    // Remove search from query as it's not a field in the document
    delete query.search;

    const products = await Product.find(query)
      .populate("category", "name description")
      .populate("seller", "fullName profileImageURL sellerStatus email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalProducts = await Product.countDocuments(query);
    const productsData = _.map(products, (product) =>
      _.omit(product.toObject(), ["is_approved"])
    );
    res.status(200).json({
      success: true,
      message:
        products.length > 0
          ? "Product retrieved successfully."
          : "No product listed at the moment",
      data: paginated_result(page, limit, totalProducts, productsData),
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
    const user = await User.findById(getIdFromToken(req));

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Unauthenticated user cannot list a product.",
        data: null,
      });
      return;
    }

    if (!user?.role?.includes("seller")) {
      res.status(400).json({
        success: false,
        message: "User is not a seller.",
        data: null,
      });
      return;
    }

    if (user.sellerStatus !== "approved") {
      res.status(400).json({
        success: false,
        message: "Seller is not approved yet.",
        data: null,
      });
      return;
    }

    const {
      name,
      categoryId,
      price,
      location,
      description,
      phoneNumber,
      quantity,
      productType,
    } = req.body;
    const categoryExist = await Category.findById(categoryId);
    if (!categoryExist) {
      res.status(400).json({
        success: false,
        message: "Category does not exist.",
        data: null,
      });
      return;
    }

    if (price <= 0) {
      res.status(400).json({
        success: false,
        message: "Price must be greater than zero.",
        data: null,
      });
      return;
    }

    const files = req.files as Express.Multer.File[];

    // Check if files are provided
    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: "Please upload product images.",
        data: null,
      });
      return;
    }

    // Separate images and videos
    const imageFiles = files.filter((file) =>
      file.mimetype.startsWith("image/")
    );
    const videoFiles = files.filter((file) =>
      file.mimetype.startsWith("video/")
    );

    if (imageFiles.length < 3) {
      res.status(400).json({
        success: false,
        message: "Please upload at least 3 product images.",
        data: null,
      });
      return;
    }

    // Upload images to ImageKit
    let productImageUrls: string[] = [];
    let productVideoUrls: string[] = [];

    if (imageFiles.length > 0) {
      productImageUrls = await uploadMultipleToImageKit(
        imageFiles,
        "/products/images",
        ["product", "marketplace"]
      );
    }

    if (videoFiles.length > 0) {
      productVideoUrls = await uploadMultipleToImageKit(
        videoFiles,
        "/products/videos",
        ["product", "marketplace", "video"]
      );
    }

    const productId = () => {
      return `DM-${Date.now()}`;
    };

    const newProduct = await Product.create({
      name,
      price,
      quantity,
      productId: productId(),
      category: categoryId,
      location,
      description,
      seller: user?._id,
      productImage: productImageUrls,
      productVideos: productVideoUrls,
      sellerPhoneNumber: phoneNumber,
      productType,
    });

    const productData = _.omit(newProduct.toObject(), []);

    const notificationData: CreateNotificationData = {
      recipient: user?._id! as string,
      recipientModel: "User" as const,
      body: "Your product listing has been successfully submitted and is now pending review by the admin.",
      type: "market",
      title: "Product Listing Notification",
    };

    const allowedAdmin = await Admin.find({
      role: { $in: ["admin", "super_admin"] },
    }).select("_id email");

    const tasks: Promise<any>[] = [
      createNotification(notificationData),
      sendEmail(
        user?.email!,
        "Product Listing Notification",
        "Your product listing has been successfully submitted and is now pending review by the admin."
      ),
    ];

    for (const admin of allowedAdmin) {
      const adminNotification: CreateNotificationData = {
        recipient: admin._id as string,
        recipientModel: "Admin" as const,
        body: `A new product listing with ID ${newProduct._id} is pending your approval.`,
        type: "market",
        title: "Product Listing Notification",
      };
      tasks.push(createNotification(adminNotification));
      tasks.push(
        sendEmail(
          admin.email,
          "Product Listing Notification",
          `A new product listing with ID ${newProduct._id} is pending your approval.`
        )
      );
    }

    await Promise.allSettled(tasks);

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
    const user = await User.findById(getIdFromToken(req));
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    let updateData = { ...req.body };

    // If new files are uploaded, process them
    if (files && files.length > 0) {
      const imageFiles = files.filter((file) =>
        file.mimetype.startsWith("image/")
      );
      const videoFiles = files.filter((file) =>
        file.mimetype.startsWith("video/")
      );

      if (imageFiles.length > 0) {
        const productImageUrls = await uploadMultipleToImageKit(
          imageFiles,
          "/products/images",
          ["product", "marketplace"]
        );
        updateData.productImage = productImageUrls;
      }

      if (videoFiles.length > 0) {
        const productVideoUrls = await uploadMultipleToImageKit(
          videoFiles,
          "/products/videos",
          ["product", "marketplace", "video"]
        );
        updateData.productVideos = productVideoUrls;
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    const productData = _.omit(updatedProduct, []);

    const notificationData: CreateNotificationData = {
      recipient: user?._id! as string,
      recipientModel: "User" as const,
      body: "Product has been updated. It is awaiting review by the admin",
      type: "market",
      title: "Product Updated",
    };

    await createNotification(notificationData);

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
    const product = await Product.findOne({
      _id: req.params.id,
      quantity: { $gt: 0 },
    })
      .populate("seller", "fullName profileImageURL sellerStatus email")
      .populate("category", "name description");
    if (product) {
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

export const getUnsoldProductsByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let query: any = { ...req.query };
    query.quantity = { $gt: 0 };
    query.is_approved = true;
    query.is_reserved = false;
    query.category = req.params.category;

    // Price range filter
    if (req.query.minPrice) {
      query.price = { ...query.price, $gte: Number(req.query.minPrice) };
    }
    if (req.query.maxPrice) {
      query.price = { ...query.price, $lte: Number(req.query.maxPrice) };
    }

    // Remove pagination and price fields from query
    delete query.page;
    delete query.limit;
    delete query.minPrice;
    delete query.maxPrice;

    const search = req.query.search || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Add search functionality to query if there's a search term
    if (search) {
      const categories = await Category.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");
      const categoryIds = categories.map((c) => c._id);
      query.$or = [
        { name: { $regex: search, $options: "i" } }, // Search by product name (case insensitive)
        { description: { $regex: search, $options: "i" } }, // Search by description (case insensitive)
        { category: { $in: categoryIds } }, // Search by category IDs
      ];
    }

    // Remove search from query as it's not a field in the document
    delete query.search;

    const products = await Product.find(query)
      .populate("category", "name description")
      .populate("seller", "fullName profileImageURL sellerStatus email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    if (products) {
      const productsData = _.map(products, (product) =>
        _.omit(product.toObject(), ["is_approved"])
      );
      res.status(200).json({
        success: true,
        message:
          products.length > 0
            ? "Product retrieved successfully."
            : "No product listed at the moment",
        data: productsData,
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

export const getAllLongUnsoldProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let query: any = { ...req.query };
    query.quantity = { $gt: 0 };
    query.is_approved = true;

    // Price range filter
    if (req.query.minPrice) {
      query.price = { ...query.price, $gte: Number(req.query.minPrice) };
    }
    if (req.query.maxPrice) {
      query.price = { ...query.price, $lte: Number(req.query.maxPrice) };
    }

    // Remove pagination and price fields from query
    delete query.page;
    delete query.limit;
    delete query.minPrice;
    delete query.maxPrice;

    const search = req.query.search || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Add search functionality to query if there's a search term
    if (search) {
      const categories = await Category.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");
      const categoryIds = categories.map((c) => c._id);
      query.$or = [
        { name: { $regex: search, $options: "i" } }, // Search by product name (case insensitive)
        { description: { $regex: search, $options: "i" } }, // Search by description (case insensitive)
        { category: { $in: categoryIds } }, // Search by category IDs
      ];
    }

    // Remove search from query as it's not a field in the document
    delete query.search;

    const products = await Product.find(query)
      .populate("category", "name description")
      .populate("seller", "fullName profileImageURL sellerStatus email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: 1 });
    const productsData = _.map(products, (product) =>
      _.omit(product.toObject(), ["is_approved"])
    );
    res.status(200).json({
      success: true,
      message:
        products.length > 0
          ? "Product retrieved successfully."
          : "No product listed at the moment",
      data: productsData,
    });
  } catch (error) {
    next(error);
  }
};

export const getSellerProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sellerId = getIdFromToken(req);

    if (!sellerId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid token",
      });
      return;
    }

    // Get pagination parameters
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get search parameter
    const search = req.query.search || "";

    let query: any = {
      seller: sellerId,
    };

    // Price range filter
    if (req.query.minPrice) {
      query.price = { ...query.price, $gte: Number(req.query.minPrice) };
    }
    if (req.query.maxPrice) {
      query.price = { ...query.price, $lte: Number(req.query.maxPrice) };
    }

    // Add search functionality if there's a search term
    if (search) {
      const categories = await Category.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");
      const categoryIds = categories.map((c) => c._id);
      query.$or = [
        { name: { $regex: search, $options: "i" } }, // Search by product name (case insensitive)
        { description: { $regex: search, $options: "i" } }, // Search by description (case insensitive)
        { category: { $in: categoryIds } }, // Search by category IDs
      ];
    }

    // Get products with pagination
    const products = await Product.find(query)
      .populate("category", "name description")
      .populate("seller", "fullName profileImageURL sellerStatus email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      message:
        products.length > 0
          ? "Products retrieved successfully."
          : "No products found",
      data: paginated_result(page, limit, totalProducts, products),
    });
  } catch (error) {
    next(error);
  }
};
