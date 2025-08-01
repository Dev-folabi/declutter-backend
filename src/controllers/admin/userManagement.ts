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
    const { status, verification, roles, search = '' } = req.query;

    const filters: any = {
      fullName: { $regex: search, $options: 'i' },
    };

    if (status) filters.status = status;
    if (verification) filters.verificationStatus = verification;
    if (roles) filters.role = roles;

    // Count total number of users matching the filters
    const count = await User.countDocuments(filters);

    //   handle page overflow
    if ((page - 1) * per_page >= count) {
      res.status(200).json({
        success: true,
        message: 'No users on this page',
        data: paginated_result(page, per_page, count, []),
      });
    }
    // Query the users collection using filters, pagination and sort
    const users = await User.find(filters)
      .select('-password -pin') //  Exclude sensitive fields
      .skip((page - 1) * +per_page)
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
export const verifyUserDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, comment } = req.body;
    const { userId } = req.params;
    
    //  Find user by ID to verify
    const user = await User.findById(userId);
    if (!user) return handleError(res, 404, 'User not found');

    //  Update user verification status and optional admin comment
    user.verificationStatus = status;
    if (comment) user.adminComments = comment;
    await user.save();

    //    send email notification to the user
    const subject =
      status === 'verified'
        ? 'Your Documents Have Been Verified'
        : 'Your Document Verification Was Rejected';

    const message =
      status === 'verified'
        ? `<p>Hello ${user.fullName},</p><p>Your account have been successfully verified. You now have full access to your account.</p>`
        : `<p>Hello ${user.fullName},</p><p>Unfortunately, your account verification was rejected.</p><p>Reason: ${comment || 'No reason provided'}</p>`;
    //  Send email notification to the user
    await sendEmail(user.email, subject, message);

    // omit sensitive data from the response
    const sanitizedUser = _.omit(user.toObject(), ['password', 'pin']);

    //  Log the admin's action for auditing
    await AdminActivityLog.create({
      admin: (req as any).admin._id,
      user: userId,
      action: `Marked user verification as ${status}`,
      note: comment,
    });

    res.status(200).json({
      success: true,
      message: `${user.fullName} has been ${status}`,
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
