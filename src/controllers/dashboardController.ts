import { Request, Response, NextFunction } from 'express';
import { IUser } from '../types/model';
import { Product } from '../models/productList';
import { Order } from '../models/order';
import { Transaction } from '../models/transactionModel';
import { paginated_result } from '../utils/pagination';

export const getSellerDashboard = async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(getIdFromToken(req));
    if (!user) {
      res.status(400).json({
        success: false,
        message: "Unauthenticated user cannot list a product.",
        data: null,
      });
      return;
    }

  const sellerId = user.id;
  const { page = 1, limit = 10 } = req.query;

  try {
    // Check if the user is a seller
    if (!user.role.includes('seller')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You must be a seller to view this dashboard.',
      });
    }

    // --- Summary Cards & Sales ---
    const [totalUploadedItems, availableItems, soldItems, salesData] = await Promise.all([
      Product.countDocuments({ seller: sellerId }),
      Product.countDocuments({ seller: sellerId, is_sold: false }),
      Product.countDocuments({ seller: sellerId, is_sold: true }),
      Order.aggregate([
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productDetails'
          }
        },
        { $unwind: '$productDetails' },
        {
          $match: {
            'productDetails.seller': sellerId,
            'status': 'paid'
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$items.price' }
          }
        }
      ])
    ]);

    const totalSales = salesData.length > 0 ? salesData[0].totalSales : 0;

    // --- Withdrawal History ---
    const withdrawalQuery = {
      userId: sellerId,
      transactionType: 'debit',
      description: 'Wallet Withdrawal',
    };
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const [withdrawals, totalWithdrawals] = await Promise.all([
      Transaction.find(withdrawalQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      Transaction.countDocuments(withdrawalQuery),
    ]);

    const withdrawalHistory = paginated_result(pageNumber, limitNumber, totalWithdrawals, withdrawals, skip);

    // --- Sales History ---
    const sellerProducts = await Product.find({ seller: sellerId }).select('_id');
    const sellerProductIds = sellerProducts.map(p => p._id);

    const salesHistoryQuery = { 'items.product': { $in: sellerProductIds } };

    const [sales, totalSalesCount] = await Promise.all([
        Order.find(salesHistoryQuery)
            .populate({
                path: 'items.product',
                select: 'name productImage price'
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber),
        Order.countDocuments(salesHistoryQuery)
    ]);

    const formattedSales = sales.map(order => {
        const items = order.items.filter(item =>
            sellerProductIds.some(id => id.equals((item.product as any)._id))
        );
        return {
            ...order.toObject(),
            items: items.map(item => {
                const product: any = item.product;
                return {
                    name: product.name,
                    price: item.price,
                    productImage: product.productImage[0] || null
                };
            }),
            status: order.status === 'paid' ? 'Completed' : order.status === 'refunded' ? 'Returned' : order.status
        }
    });

    const salesHistory = paginated_result(pageNumber, limitNumber, totalSalesCount, formattedSales, skip);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          sales: totalSales,
          totalUploadedItems,
          availableItems,
          soldItems,
        },
        withdrawalHistory,
        salesHistory,
      },
    });

  } catch (error) {
    next(error);
  }
};
