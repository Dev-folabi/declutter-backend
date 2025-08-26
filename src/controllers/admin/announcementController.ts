import { User } from '../../models/userModel';
import { Admin } from '../../models/adminModel';
import { Announcement } from '../../models/announcement';
import { getIdFromToken } from '../../function/token';
import { sendEmail } from '../../utils/mail';
import { Request, Response, NextFunction } from 'express';
export const createAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const {title, message, category} = req.body;
        const adminId =  getIdFromToken(req);
        const admin = await Admin.findById(adminId);
        if (!admin) {
            res.status(401).json({
                success: false,
                message: "You are not authorized to perform this action",
                data: null
            });
            return;
        };

        const newAnnouncement = await Announcement.create({
            title,
            message,
            category,
            createdBy: admin._id
        });
        
        // fetch users based on the category selected
        let users;
        if (category === 'Buyers') {
            users = await User.find({role: 'buyer'});
        } else if (category === 'Sellers') {
            users = await User.find({role: 'seller'});
        } else if (category === 'All') {
            users = await User.find({}, 'email');
        } else {
            res.status(400).json({
                success: false,
                message: "Invalid category. Must be 'Buyers', 'Sellers', or 'All'.",
            })
            return;
        }

        const userEmails = users.map(user => user.email);
        sendEmail(
            "no-reply@declutmart.com",
            `New Announcement: ${title}`,
            message,
            userEmails,
        );
        res.status(201).json({
            success: true,
            message: "Announcement created successfully",
            data: newAnnouncement
        });


    }catch(error) {
        next(error);
    }

}