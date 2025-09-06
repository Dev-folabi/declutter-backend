import { Request, Response, NextFunction } from 'express';
import { handleError } from '../../error/errorHandler';
import { User } from '../../models/userModel';
import { AdminActivityLog } from '../../models/adminAction';
import { sendEmail } from '../../utils/mail';
import { paginated_result } from '../../utils/pagination';
import _ from 'lodash';

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const per_page = Number(req.query.limit) || 10;
    const { status, sellerStatus, roles, search = '' } = req.query;

    const filters: any = {};

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filters.$or = [{ fullName: searchRegex }, { email: searchRegex }];
    }

    if (status) filters.status = status;
    if (sellerStatus) filters.sellerStatus = sellerStatus;
    if (roles) filters.role = roles;

    // Count total number of users matching the filters
    const count = await User.countDocuments(filters);

    // Query the users collection using filters, pagination and sort
    const users = await User.find(filters)
      .select('-password -pin') //  Exclude sensitive fields
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
    const { status, note } = req.body;
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return handleError(res, 404, 'User not found');

    //   update user status and isSuspended flag
    user.status = status;
    user.isSuspended = status === 'suspended';
    //   then save the user
    await user.save();

    // Send email notification to the user
    const subject = `Your Account Status has been Updated to ${status}`;
    const message = `<p>Hello ${user.fullName},</p><p>Your account status has been updated to ${status}.</p>${note ? `<p>Note: ${note}</p>` : ''}`;
    await sendEmail(user.email, subject, message);

    //   omit senitive data from the respnse
    const sanitizedUser = _.omit(user.toObject(), ['password', 'pin']);
    await AdminActivityLog.create({
      admin: (req as any).admin._id,
      user: userId,
      action: `Updated status to ${status}`,
      note,
    });

    res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      data: sanitizedUser,
    });
  } catch (error) {
    next(error);
  }
};
