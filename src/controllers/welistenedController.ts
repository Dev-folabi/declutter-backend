import { Request, Response, NextFunction } from "express";
import { WeListened } from "../models/weListened";
import { Admin } from "../models/adminModel";
import { sendBulkEmailBCC } from "../utils/mail";
import { paginated_result } from "../utils/pagination";
import { handleError } from "../error/errorHandler";

export const createWeListened = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { firstName, lastName, email, message } = req.body;
    if (!firstName || !lastName || !email || !message) {
      handleError(res, 400, "All fields are required");
    }
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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    const weListened = await WeListened.find().skip(startIndex).limit(limit);
    const count = await WeListened.countDocuments();

    res.status(200).json({
      success: true,
      message: "WeListened retrieved successfully.",
      data: paginated_result(page, limit, count, weListened, startIndex),
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
       handleError(res, 404, "WeListened not found");
       return;
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
    const { hasRead } = req.body;

    // Check if other fields are present in the request body
    const invalidFields = Object.keys(req.body).filter(
      (key) => key !== "hasRead"
    );
    if (invalidFields.length > 0) {
       handleError(
        res,
        400,
        `Only the hasRead field can be updated. Invalid fields: ${invalidFields.join(
          ", "
        )}`
      );
      return;
    }

    const updatedWeListened = await WeListened.findByIdAndUpdate(
      id,
      { hasRead },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedWeListened) {
       handleError(res, 404, "WeListened not found");
       return;
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
) => {
  try {
    const { id } = req.params;
    const deletedWeListened = await WeListened.findByIdAndDelete(id);
    if (!deletedWeListened) {
       handleError(res, 404, "WeListened not found");
       return;
    }
    res.status(200).json({
      success: true,
      message: "WeListened deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
