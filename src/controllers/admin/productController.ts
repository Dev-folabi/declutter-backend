import { Request, Response, NextFunction } from 'express';
import  { Types } from 'mongoose';
import { Product } from '../../models/productList';
import _ from 'lodash';
import { getIdFromToken } from '../../function/token';
import { User } from '../../models/userModel';
import { Admin } from '../../models/adminModel';
import { createNotification } from '../notificationController';
import { sendEmail } from '../../utils/mail'
import { paginated_result } from '../../utils/pagination';

export const moderateProductListing = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const admin = await Admin.findById(getIdFromToken(req))
        if (!admin) {
            res.status(403).json({
                success: false,
                message: "You are not authorized for this action.",
                data: null
            })
            return;
        }
        const {isApproved, reason} = req.body
        const productId = req.params.id
        const product = await Product.findById(productId).populate('seller');
        if (!product) {
            res.status(404).json({
                success: false,
                message: "Product not found.",
                data: null,
            })
            return
        }

        let updatedProduct;
        if (isApproved === true ) {
            updatedProduct = await Product.findByIdAndUpdate(
                productId,
                {
                  $set: {
                    is_approved: true, 
                    rejection_reason: null ,
                    status: 'approved'
                  }
                },
                { new: true}
            )
        } else if (isApproved === false) {
           if(!reason || reason.trim() === '') {
            res.status(400).json({
                success: false,
                message: "Rejection reason is required.",
            })
            return;
           }
           updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { 
              $set: {
                is_approved: false, 
                rejection_reason: reason,
                status : 'rejected'
              }
            },
            {new:true}
           )
        } else {
          res.status(400).json({
              success: false,
              message: "Ïnvalid  action. Must be either true or false"
          })
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
        const actionText = isApproved ? 'approve' : 'reject';
        const statusText = isApproved ? 'approved' : 'rejected';
        const titleText = isApproved ? 'Approval' : 'Rejection';
        const seller = await User.findById(product.seller)
        
        const notifications = [

            createNotification({
                // user: admin._id,
                recipient: admin._id,
                recipientModel: 'Admin',
                body: `You have ${statusText} the product (${productName})`,
                type: 'market',
                title: `Product ${titleText}`,
            }),

            createNotification({
                recipient: (product.seller as any)._id,
                recipientModel: 'User',
                body: isApproved ? `Your product (${productName}) has been approved and listed.`
                : `Your product (${productName}) was rejected. Reason: ${reason}`,
                type: 'market',
                title: `Product ${titleText}`,
            }),

            // send email to the admin
            sendEmail(
                admin.email,
                `Product ${titleText} Notification`,
                `You ${statusText} the product (${productName}).`
            ),

            // send email to the seller 
            sendEmail(
                seller?.email!,
                `Product ${titleText} Notification`,
                isApproved
                ?  `Your product ${productName} has been approved and listed.`
                : `Your product ${productName} was rejected. Reason: ${reason}`
            )
        ];
        // wait for all notifications to be sent 
        await Promise.all(notifications);

        res.status(200).json({
            success: true,
            message: `Product ${actionText}ed successfully.`,
            data: updatedProduct,
        })
        return;

    } catch (error) {
        next(error)
      }
}
    

export const getProductsByAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = await Admin.findById(getIdFromToken(req));

    if (!admin) {
      res.status(400).json({
        success: false,
        message: 'You don’t have the permission to view this page.',
        data: null,
      });
      return;
    }

    const { search = '' } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build dynamic query object
    let query: any = { ...req.query };
    delete query.page;
    delete query.limit;
    delete query.search;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Count total matching documents
    const totalProducts = await Product.countDocuments(query);

    const products = await Product.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const productsData = _.map(products, (product) =>
      _.omit(product.toObject(), ['is_approved', 'is_sold'])
    );

    // Use your pagination utility
    const paginatedData = paginated_result(
      page,
      limit,
      totalProducts,
      productsData
    );

    res.status(200).json({
      success: true,
      message:
        products.length > 0
          ? 'Products retrieved successfully.'
          : 'No products listed at the moment.',
      data: paginatedData,
    });
  } catch (error) {
    next(error);
  }
};

   
// flag or remove user listins 
export const flagOrRemoveListing = async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const { action, reason } = req.body;
      const adminId = getIdFromToken(req);

      const product = await Product.findById(productId);
      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found.'
        })
        return;
      } 

      const productName = product.name;
      const seller = product.seller;
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
          flaggedBy:  new Types.ObjectId(adminId),
          date:  new Date(),
        });
      } else if (action === "remove") {
        product.status = "removed";
      } else {
        res.status(400).json({ error: "Invalid action" });
        return;
      }
      await product.save();


    // Send notifications and emails
    const notifications = [

      // Notify admin
      createNotification({
        recipient: admin._id,
        recipientModel: 'Admin',
        body: `You have ${action}ed the product (${productName}).`,
        type: 'market',
        title: `Product ${action === 'flag' ? 'Flagged' : 'Removed'}`,
      }),

      // Notify seller
      createNotification({
        recipient: (seller as any)._id,
        recipientModel: 'User',
        body: action === 'flag'
          ? `Your product (${productName}) was flagged. Reason: ${reason}`
          : `Your product (${productName}) has been removed from the marketplace.`,
        type: 'market',
        title: `Product ${action === 'flag' ? 'Flagged' : 'Removed'}`,
      }),

      // Email to admin
      sendEmail(
        admin.email,
        `Product ${action === 'flag' ? 'Flagged' : 'Removed'} Notification`,
        `You ${action}ged the product (${productName}).`
      ),

      // Email to seller
      sendEmail(
        (seller as any)?.email!,
        `Product ${action === 'flag' ? 'Flagged' : 'Removed'} Notification`,
        action === 'flag'
          ? `Your product "${productName}" was flagged. Reason: ${reason}`
          : `Your product "${productName}" has been removed from the marketplace.`
      )
    ];
    await Promise.all(notifications);

      res.status(200).json({ 
        message: `Product successfully ${action === "flag" ? "flagged" : "removed"}.`,
        data: product,
      });
      return;
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
};
  
     

