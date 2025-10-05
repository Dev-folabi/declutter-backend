import { Request, Response, NextFunction } from 'express';
import { handleError } from '../../error/errorHandler';
import { User } from '../../models/userModel';
import { AdminActivityLog } from '../../models/adminAction';
import { sendEmail } from '../../utils/mail';
import { paginated_result } from '../../utils/pagination';
import { getIdFromToken } from '../../function/token';
import { Admin } from '../../models/adminModel';
import _ from 'lodash';
import { log } from 'console';

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const per_page = Number(req.query.limit) || 10;
    const { status, sellerStatus, roles, isSuspended, search = '' } = req.query;

    const filters: any = {};

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filters.$or = [{ fullName: searchRegex }, { email: searchRegex }];
    }

    if (status) filters.status = status;
    if (sellerStatus) filters.sellerStatus = sellerStatus;
    if (roles) {
      const rolesArray = (roles as string).split(',');
      filters.role = { $in: rolesArray };
    }
    if (isSuspended === 'true') {
      filters['suspension.isSuspended'] = true;
    } else if (isSuspended === 'false') {
      filters['suspension.isSuspended'] = false;
    }


    // Count total number of users matching the filters
    const count = await User.countDocuments(filters);

    // Query the users collection using filters, pagination and sort
    const users = await User.find(filters)
      .select('fullName email role sellerStatus suspension profileImageURL createdAt') //  Explicitly select fields
      .skip((page - 1) * per_page)
      .limit(per_page)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: paginated_result(page, per_page, count, users),
    });

  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password -pin');

    if (!user) {
      return handleError(res, 404, 'User not found');
    }

    res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

// verify or reject user documents
export const verifySellerDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, reason, comment } = req.body;
    const { userId } = req.params;

    //  Find user by ID to verify
    const user = await User.findById(userId);
    if (!user) return handleError(res, 404, "User not found");

    if (status === "approved") {
      user.sellerStatus = "approved";
    } else if (status === "rejected") {
      if (!reason) {
        res
          .status(400)
          .json({ success: false, message: "Reason for rejection is required." })
        return;
      }
      user.sellerStatus = "rejected";
      user.rejectionReason = reason;
    } else {
      res
        .status(400)
        .json({ success: false, message: "Invalid status." })
      return;
    }

    if (comment) user.adminComment = comment;
    await user.save();

    //    send email notification to the user
    const subject =
      status === "approved"
        ? "Your Seller Application has been Approved"
        : "Your Seller Application was Rejected";

    const message =
      status === "approved"
        ? `<p>Hello ${user.fullName},</p><p>Your seller application has been successfully verified. You can now start selling.</p>`
        : `<p>Hello ${user.fullName},</p><p>Unfortunately, your seller application was rejected.</p><p>Reason: ${reason}</p>`;
    //  Send email notification to the user
    await sendEmail(user.email, subject, message);

    // omit sensitive data from the response
    const sanitizedUser = _.omit(user.toObject(), ["password", "pin"]);

    //  Log the admin's action for auditing
    await AdminActivityLog.create({
      admin: (req as any).admin._id,
      user: userId,
      action: `Marked seller verification as ${status}`,
      note: comment,
    });

    res.status(200).json({
      success: true,
      message: `Seller application for ${user.fullName} has been ${status}`,
      data: sanitizedUser,
    });
  } catch (error) {
    next(error);
  }
};

// Activate or suspend user
export const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action, reason } = req.body;
    const { userId } = req.params;

    const adminId = getIdFromToken(req);
    const admin = await Admin.findById(adminId)
    if (!admin) return handleError(res, 401, "You are not authorized to perform this action.");

    const user = await User.findById(userId);
    if (!user) return handleError(res, 404, 'User not found');

    let logAction = '';

    if (action === "suspend") {
  
      if (user.suspension.isSuspended) {
        return handleError(res, 400, "User is already suspended");
      }

      logAction = 'suspended_user';
      user.suspension = {
        isSuspended: true,
        reason: reason || "No reason provided",
        actionBy: (req as any).admin._id,
        actionAt: new Date(),
      }

    } else if (action === "activate") {

      if (!user.suspension.isSuspended) {
        return handleError(res, 400, "User is not suspended");
      }

      logAction = 'activated_user';
      user.suspension = {
        isSuspended: false,
        reason: reason || "No reason provided",
        actionBy: (req as any).admin._id,
        actionAt: new Date(),
      }
    }

    await user.save();

    // Send email notification to the user
    const subject =
      action === "suspend"
        ? "Important: Your Account has been Suspended"
        : "Goodnews: Your Account has been Activated";
    const message =
      action === "suspend"
        ? `Your account has been suspended. Reason: ${reason || "No reason provided"}.`
        : "Your account has been reactivated and is now active.";

    await sendEmail(user.email, subject, message);

    //   omit senitive data from the respnse
    const sanitizedUser = _.omit(user.toObject(), ['password', 'pin']);

    await AdminActivityLog.create({
      admin: (req as any).admin._id,
      user: userId,
      action: logAction,
      reason,
    });

    res.status(200).json({
      success: true,
      message: action === "suspend"
        ? "User account has been suspended successfully."
        : "User account has been activated successfully.",
      data: sanitizedUser,
    });

  } catch (error) {
    next(error);
  }
};

export const getAdminUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admins = await Admin.find().select("fullName email role emailVerified is_admin profileImageURL createdAt updatedAt");
    res.status(200).json({
      success: true,
      message: "Admin users fetched successfully.",
      data: admins,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { adminId } = req.params;
    const admin = await Admin.findById(adminId).select('fullName email role emailVerified is_admin profileImageURL createdAt updatedAt');

    if (!admin) {
      return handleError(res, 404, 'Admin not found');
    }

    res.status(200).json({
      success: true,
      message: 'Admin fetched successfully',
      data: admin,
    });
  } catch (error) {
    next(error);
  }
}