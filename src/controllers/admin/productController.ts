import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { Product } from "../../models/productList";
import _ from "lodash";
import { getIdFromToken } from "../../function/token";
import { Admin } from "../../models/adminModel";
import { createNotification } from "../notificationController";
import { sendEmail } from "../../utils/mail";
import { paginated_result } from "../../utils/pagination";
import { Category } from "../../models/category";
import { CreateNotificationData } from "../../types/model";

export const moderateProductListing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admin = await Admin.findById(getIdFromToken(req));
    if (!admin) {
      res.status(403).json({
        success: false,
        message: "You are not authorized for this action.",
        data: null,
      });
      return;
    }
    const { isApproved, reason } = req.body;
    const productId = req.params.id;
    const product = await Product.findById(productId).populate("seller");
    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found.",
        data: null,
      });
      return;
    }

    let updatedProduct;
    if (isApproved === true) {
      updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
          $set: {
            is_approved: true,
            rejection_reason: null,
            status: "approved",
          },
        },
        { new: true }
      );
    } else if (isApproved === false) {
      if (!reason || reason.trim() === "") {
        res.status(400).json({
          success: false,
          message: "Rejection reason is required.",
        });
        return;
      }
      updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
          $set: {
            is_approved: false,
            rejection_reason: reason,
            status: "rejected",
          },
        },
        { new: true }
      );
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid action. Must be either true or false",
      });
      return;
    }

    if (!updatedProduct) {
      res.status(500).json({
        success: false,
        message: "Something went wrong updating the product.",
      });
      return;
    }
    // notifications and emails
    const productName = product.name;
    const actionText = isApproved ? "approve" : "reject";
    const statusText = isApproved ? "approved" : "rejected";
    const titleText = isApproved ? "Approval" : "Rejection";

    const adminNotificationData: CreateNotificationData = {
      recipient: admin._id as string,
      recipientModel: "Admin" as const,
      body: `You have ${statusText} the product (${productName})`,
      type: "market",
      title: `Product ${titleText}`,
    };

    const sellerNotificationData: CreateNotificationData = {
      recipient: (product.seller as any)._id as string,
      recipientModel: "User" as const,
      body: isApproved
        ? `Your product (${productName}) has been approved and listed.`
        : `Your product (${productName}) was rejected. Reason: ${reason}`,
      type: "market",
      title: `Product ${titleText}`,
    };

    const notifications = [
      createNotification(adminNotificationData),
      createNotification(sellerNotificationData),
      // send email to the admin
      sendEmail(
        admin.email,
        `Product ${titleText} Notification`,
        `You ${statusText} the product (${productName}).`
      ),

      // send email to the seller
      sendEmail(
        (product.seller as any)?.email!,
        `Product ${titleText} Notification`,
        isApproved
          ? `Your product ${productName} has been approved and listed.`
          : `Your product ${productName} was rejected. Reason: ${reason}`
      ),
    ];
    // wait for all notifications to be sent
    await Promise.all(notifications);

    res.status(200).json({
      success: true,
      message: `Product ${actionText}ed successfully.`,
      data: updatedProduct,
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const getProductsByAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admin = await Admin.findById(getIdFromToken(req));

    if (!admin) {
      res.status(400).json({
        success: false,
        message: "You don’t have the permission to view this page.",
        data: null,
      });
      return;
    }

    const { search = "", status, is_approved, is_sold } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build dynamic query object
    let query: any = {};

    if (status) {
      query.status = status;
    }
    if (is_approved) {
      query.is_approved = is_approved;
    }
    if (is_sold === "true") {
      query.quantity = 0;
    } else if (is_sold === "false") {
      query.quantity = { $gt: 0 };
    }

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      const categoryQuery = await Category.find({ name: searchRegex }).select(
        "_id"
      );
      const categoryIds = categoryQuery.map((cat) => cat._id);

      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { productId: searchRegex },
        { category: { $in: categoryIds } },
      ];
    }

    // Count total matching documents
    const totalProducts = await Product.countDocuments(query);

    const products = await Product.find(query)
      .populate("category")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Use your pagination utility
    const paginatedData = paginated_result(page, limit, totalProducts, products);

    res.status(200).json({
      success: true,
      message:
        products.length > 0
          ? "Products retrieved successfully."
          : "No products listed at the moment.",
      data: paginatedData,
    });
  } catch (error) {
    next(error);
  }
};

// flag or remove user listins
export const flagOrRemoveListing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const { action, reason } = req.body;
    const adminId = getIdFromToken(req);

    const product = await Product.findById(productId).populate("seller");
    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found.",
      });
      return;
    }

    const productName = product.name;
    const seller = product.seller as any;
    const admin = await Admin.findById(adminId);

    if (!admin) {
      res.status(404).json({ message: "Admin not found" });
      return;
    }
    if (action === "flag") {
      if (!reason) {
        res.status(400).json({
          success: false,
          message: "Reason is required when flagging a product.",
        });
        return;
      }
      product.status = "flagged";
      if (!product.flags) {
        product.flags = [];
      }

      product.flags.push({
        reason,
        flaggedBy: new Types.ObjectId(adminId),
        date: new Date(),
      });
    } else if (action === "remove") {
      product.status = "removed";
      if (reason) {
        product.rejection_reason = reason;
      }
    } else {
      res.status(400).json({ error: "Invalid action" });
      return;
    }
    await product.save();

    const actionText = action === "flag" ? "flagged" : "removed";
    const removalReason =
      action === "remove" && reason ? ` Reason: ${reason}` : "";

    // Send notifications and emails
    const adminNotificationData: CreateNotificationData = {
      recipient: admin._id as string,
      recipientModel: "Admin" as const,
      body: `You have ${actionText} the product (${productName}).`,
      type: "market",
      title: `Product ${action === "flag" ? "Flagged" : "Removed"}`,
    };

    const sellerNotificationData: CreateNotificationData = {
      recipient: seller._id as string,
      recipientModel: "User" as const,
      body:
        action === "flag"
          ? `Your product (${productName}) was flagged. Reason: ${reason}`
          : `Your product (${productName}) has been removed from the marketplace.${removalReason}`,
      type: "market",
      title: `Product ${action === "flag" ? "Flagged" : "Removed"}`,
    };

    const notifications = [
      // Notify admin
      createNotification(adminNotificationData),
      // Notify seller
      createNotification(sellerNotificationData),
      // Email to admin
      sendEmail(
        admin.email,
        `Product ${action === "flag" ? "Flagged" : "Removed"} Notification`,
        `You ${actionText} the product (${productName}).`
      ),

      // Email to seller
      sendEmail(
        seller?.email!,
        `Product ${action === "flag" ? "Flagged" : "Removed"} Notification`,
        action === "flag"
          ? `Your product "${productName}" was flagged. Reason: ${reason}`
          : `Your product "${productName}" has been removed from the marketplace.${removalReason}`
      ),
    ];
    await Promise.all(notifications);

    res.status(200).json({
      message: `Product successfully ${actionText}.`,
      data: product,
    });
    return;
  } catch (err) {
    next(err);
  }
};
