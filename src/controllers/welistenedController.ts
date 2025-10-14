import { Request, Response, NextFunction } from "express";
import { WeListened } from "../models/weListened";
import { Admin } from "../models/adminModel";
import { sendBulkEmailBCC } from "../utils/mail";

export const createWeListened = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { firstName, lastName, email, message } = req.body;
    const newWeListened = await WeListened.create({
      firstName,
      lastName,
      email,
      message,
    });

    const admins = await Admin.find({
      role: { $in: ["admin", "super_admin"] },
    }).select("email");

    if (admins.length > 0) {
      const recipientEmails = admins.map((admin) => admin.email);
      const emailSubject = "New User Feedback Received";
      const emailBody = `
        <p>A new feedback submission has been received.</p>
        <p><strong>Details:</strong></p>
        <ul>
          <li><strong>Name:</strong> ${firstName} ${lastName}</li>
          <li><strong>Email:</strong> ${email}</li>
        </ul>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `;

      await sendBulkEmailBCC(recipientEmails, emailSubject, emailBody);
    }

    res.status(201).json({
      success: true,
      message: "Your message has been submitted successfully.",
      data: newWeListened,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllWeListened = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const weListened = await WeListened.find();
    res.status(200).json({
      success: true,
      message: "WeListened retrieved successfully.",
      data: weListened,
    });
  } catch (error) {
    next(error);
  }
};

export const getWeListenedById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const weListened = await WeListened.findById(id);
    if (!weListened) {
      res.status(404).json({ message: "WeListened not found" });
    }
    res.status(200).json({
      success: true,
      message: "WeListened retrieved successfully.",
      data: weListened,
    });
  } catch (error) {
    next(error);
  }
};

export const updateWeListened = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updatedWeListened = await WeListened.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedWeListened) {
      res.status(404).json({
        success: false,
        message: "WeListened not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Your message has been updated successfully.",
      data: updatedWeListened,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWeListened = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response<any, Record<string, any>> | void> => {
  try {
    const { id } = req.params;
    const deletedWeListened = await WeListened.findByIdAndDelete(id);
    if (!deletedWeListened) {
      return res.status(404).json({
        success: false,
        message: "WeListened not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "WeListened deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
