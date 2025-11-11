import { getIdFromToken } from "../../function/token";
import { Order } from "../../models/order";
import { Logistics } from "../../models/logisticModel";
import { paginated_result } from "../../utils/pagination";
import { Request, Response, NextFunction } from "express";
import { Invoice } from "../../models/invoice";
import { Admin } from "../../models/adminModel";
import { IOrder } from "../../types/model";
import PDFDocument from "pdfkit";

export const getAllLogistics = async (
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

    const { status, startDate, endDate, orderId } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query: any = {};
    if (status) {
      query.status = req.query.status;
    }
    if (orderId) {
      query.order = req.query.orderId;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    // Get total count for pagination
    const totalLogistics = await Logistics.countDocuments(query);

    // Fetch logistics based on query
    const logistics = await Logistics.find(query)
      .populate<{ order: IOrder }>({
        path: "order",
        select: "customOrderId items totalPrice status deliveryType",
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    //
    const fomattedLogistics = logistics.map((log) => {
      const date = new Date(log.createdAt);
      return {
        logisticId: log._id,
        orderId: (log.order as IOrder)?.customOrderId ?? null,
        status: log.status,
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString(),
      };
    });
    const paginatedLogistics = paginated_result(
      page,
      limit,
      totalLogistics,
      fomattedLogistics
    );

    res.status(200).json({
      success: true,
      message: "Logistics retrieved successfully.",
      data: paginatedLogistics,
    });
  } catch (error) {
    next(error);
  }
};

export const setlogisticStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admin = await Admin.findById(getIdFromToken(req));
    if (!admin) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action.",
        data: null,
      });
      return;
    }
    const { logisticId } = req.params;
    const { action } = req.body;
    const logistic = await Logistics.findById(logisticId);
    if (!logistic) {
      res.status(400).json({
        success: false,
        message: "Logistic ID is required.",
        data: null,
      });
      return;
    }
    switch (action) {
      case "picked_up":
        logistic.status = "in_transit";
        break;
      case "delivered":
        logistic.status = "delivered";
        break;
      case "to_be_picked_up":
        logistic.status = "ready_for_pickup";
        break;
      default:
        res.status(400).json({
          success: false,
          message: "Invalid action",
          data: null,
        });
    }
    await logistic.save();
    res.status(200).json({
      success: true,
      message: `Logistic status updated to ${logistic.status}`,
      data: logistic,
    });
  } catch (error) {
    next(error);
  }
};

export const createInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      orderCustomId,
      amount,
      pickupAddress,
      typeOfAssignment,
      deliveryAddress,
    } = req.body;
    const admin = await Admin.findById(getIdFromToken(req));
    if (!admin) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action.",
        data: null,
      });
      return;
    }

    const order = await Order.findOne({ customOrderId: orderCustomId });

    if (!order) {
      res.status(400).json({
        message: "Item not found.",
        data: null,
      });
      return;
    }
    if (amount <= 0) {
      res.status(400).json({
        success: false,
        message: "Amount must be greater than zero.",
        data: null,
      });
      return;
    }
    if (typeOfAssignment === "pickup" && !pickupAddress) {
      res.status(400).json({
        success: false,
        message: "Pickup address is required for pickup assignment.",
        data: null,
      });
      return;
    }
    if (typeOfAssignment === "delivery" && !deliveryAddress) {
      res.status(400).json({
        success: false,
        message: "Delivery address is required for delivery assignment.",
        data: null,
      });
      return;
    }
    if (
      typeOfAssignment === "pickup_and_delivery" &&
      (!pickupAddress || !deliveryAddress)
    ) {
      res.status(400).json({
        success: false,
        message:
          "Both pickup and delivery addresses are required for pickup and delivery assignment.",
        data: null,
      });
      return;
    }

    const invoiceId = "INV" + Math.floor(100000 + Math.random() * 900000);
    //    create invoice
    const invoice = new Invoice({
      invoiceId,
      orderId: order._id,
      amount,
      pickupAddress,
      typeOfAssignment,
      deliveryAddress,
      createdBy: admin?._id,
    });
    await invoice.save();
    res.status(201).json({
      success: true,
      message: "Invoice created successfully.",
      data: {
        invoiceId: invoice.invoiceId,
        linkedOrder: order.customOrderId,
        status: invoice.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admin = await Admin.findById(getIdFromToken(req));
    if (!admin) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action.",
        data: null,
      });
      return;
    }
    const { status, startDate, endDate, agent, search } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query: any = {};
    if (status) {
      query.status = status;
    }
    if (agent) {
      query.createdBy = agent;
    }
    if (search) {
      query.$or = [
        { pickupAddress: { $regex: search, $options: "i" } },
        { deliveryAddress: { $regex: search, $options: "i" } },
        { invoiceId: { $regex: search, $options: "i" } },
      ];
    }
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }
    const invoices = await Invoice.find(query)
      .populate({
        path: "orderId",
        select: "createdAt invoiceId agent status typeOfAssignment amount",
      })
      .populate({
        path: "createdBy",
        select: "name",
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalInvoices = await Invoice.countDocuments(query);
    const paginatedInvoices = paginated_result(
      page,
      limit,
      totalInvoices,
      invoices
    );

    res.status(200).json({
      success: true,
      message: "Invoices retrieved successfully.",
      data: paginatedInvoices,
    });
  } catch (error) {
    next(error);
  }
};

export const setInvoiceStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admin = await Admin.findById(getIdFromToken(req));
    if (!admin) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action.",
        data: null,
      });
      return;
    }
    const { id } = req.params;
    const { status } = req.body;
    const invoice = await Invoice.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true } // returns updated doc
    );

    if (!invoice) {
      res.status(404).json({
        success: false,
        message: "Invoice not found.",
        data: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Invoice status updated successfully.",
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

export const getLogisticsStats = async (
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

    // Total available items: number of orders available for pickup
    const totalAvailableItems = await Order.countDocuments({
      isAvailableForPickup: true,
    });

    // Helper aggregation on Logistics joined with Order to compute counts
    const agg = await Logistics.aggregate([
      {
        $lookup: {
          from: "orders",
          localField: "order",
          foreignField: "_id",
          as: "orderDoc",
        },
      },
      { $unwind: { path: "$orderDoc", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          status: 1,
          deliveryType: "$orderDoc.deliveryType",
        },
      },
    ]);

    let failedDeliveries = 0;
    let successfulDeliveries = 0;
    let successfulPickups = 0;
    let failedPickups = 0;

    for (const row of agg) {
      const status = row.status;
      const type = row.deliveryType;
      if (type === "delivery") {
        if (status === "cancelled") failedDeliveries += 1;
        if (status === "delivered") successfulDeliveries += 1;
      }
      if (type === "pickup") {
        if (status === "cancelled") failedPickups += 1;
        // consider in_transit or delivered as successful pickup
        if (status === "in_transit" || status === "delivered")
          successfulPickups += 1;
      }
    }

    res.status(200).json({
      success: true,
      message: "Logistics stats retrieved successfully.",
      data: {
        totalAvailableItems,
        failedDeliveries,
        successfulPickups,
        failedPickups,
        successfulDeliveries,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const downloadInvoicePdf = async (
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

    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: "Invoice id is required",
        data: null,
      });
      return;
    }

    const invoice = await Invoice.findById(id)
      .populate({
        path: "orderId",
        populate: [
          { path: "items.product", model: "Product" },
          { path: "user", model: "User", select: "fullName email" },
        ],
      })
      .populate({ path: "createdBy", select: "name" });

    if (!invoice) {
      res
        .status(404)
        .json({ success: false, message: "Invoice not found", data: null });
      return;
    }

    // Ensure invoice is successful and for delivery (or pickup_and_delivery)
    if (invoice.status !== "successfull") {
      res.status(400).json({
        success: false,
        message: "Invoice is not successful",
        data: null,
      });
      return;
    }

    const order: any = invoice.orderId as any;
    if (!order) {
      res.status(400).json({
        success: false,
        message: "Linked order not found",
        data: null,
      });
      return;
    }

    if (
      !(
        order.deliveryType === "delivery" ||
        order.deliveryType === "pickup_and_delivery"
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Invoice is not a delivery invoice",
        data: null,
      });
      return;
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    const fileName = `invoice_${invoice.invoiceId}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text("Delivery Invoice", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Invoice ID: ${invoice.invoiceId}`);
    doc.text(
      `Created At: ${((invoice as any).createdAt as Date | undefined)?.toLocaleString()}`
    );
    doc.text(`Generated By: ${(invoice.createdBy as any)?.name || "Admin"}`);
    doc.moveDown();

    // Order info
    doc.fontSize(14).text("Order Details", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Order ID: ${order.customOrderId || order._id}`);
    // Do not display customer details in the PDF as requested
    doc.text(`Delivery Type: ${order.deliveryType}`);
    doc.moveDown();

    // Addresses
    if (
      invoice.typeOfAssignment === "delivery" ||
      invoice.typeOfAssignment === "pickup_and_delivery"
    ) {
      doc.fontSize(12).text("Delivery Address:");
      doc
        .fontSize(10)
        .text(
          invoice.deliveryAddress || order.deliveryAddress?.location || "N/A"
        );
      doc.moveDown();
    }

    if (
      invoice.typeOfAssignment === "pickup" ||
      invoice.typeOfAssignment === "pickup_and_delivery"
    ) {
      doc.fontSize(12).text("Pickup Address:");
      doc.fontSize(10).text(invoice.pickupAddress || "N/A");
      doc.moveDown();
    }

    doc.moveDown();
    doc.fontSize(12).text(`Invoice Amount: #${invoice.amount.toFixed(2)}`, {
      align: "right",
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};
