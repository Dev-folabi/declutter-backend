import { Request, Response, NextFunction } from "express";
import { ContactUs } from "../models/contactUs";
import { User } from "../models/userModel";
import { getIdFromToken } from "../function/token";
import { Admin } from "../models/adminModel";




export const sendContactUsMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
        
        const msg = await ContactUs.create(req.body)
        res.status(200).json({
            success: true,
            message: "Your message has been successfully.",
            data: msg,
        });
    } catch (error) {
      next(error);
    }
};


export const getContactMessages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {

        const user = await User.findById(getIdFromToken(req))
          
        if (!user){
            res.status(400).json({
                success: false,
                message: "You dont have the permission to view this page.",
                data: null,
            });
            return
        }

        if (!(user?.is_admin)){
            res.status(400).json({
                success: false,
                message: "You are not authorized for this action.",
                data: null,
            });
            return
        }
        const admin = await Admin.findById(getIdFromToken(req))

        if (!admin) {
            res.status(400).json({
                success: false,
                message: "You are not authorized for this action.",
                data: null
            })
            return
        }
        
        const messages = await ContactUs.find().sort({"is_closed": 1})

        res.status(200).json({
            success: true,
            message: "Messages retrieved successfully.",
            data: messages,
        });
    } catch (error) {
      next(error);
    }
};

export const getSingleContactMessages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
        
        const user = await User.findById(getIdFromToken(req))
          
        if (!user){
            res.status(400).json({
                success: false,
                message: "You dont have the permission to view this page.",
                data: null,
            });
        }

        if (!(user?.is_admin)){
            res.status(400).json({
                success: false,
                message: "You are not authorized for this action.",
                data: null,
            });
        }
        const message = await ContactUs.findById(req.params.id)

        if (!message){
            res.status(400).json({
                success: false,
                message: "Message not found.",
                data: null,
            });
        }
        
        res.status(200).json({
            success: true,
            message: "Message retrieved successfully.",
            data: message,
        });
    } catch (error) {
      next(error);
    }
};


export const updateContactus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {

        const user = await User.findById(getIdFromToken(req))
          
        if (!user){
            res.status(400).json({
                success: false,
                message: "You dont have the permission to view this page.",
                data: null,
            });
        }

        if (!(user?.is_admin)){
            res.status(400).json({
                success: false,
                message: "You are not authorized for this action.",
                data: null,
            });
        }
        
        const {id} = req.params
        const message = await ContactUs.findByIdAndUpdate(id, {is_closed : true, new : true})

       
        res.status(200).json({
            success: true,
            message: "Message marked as closed.",
            data: message,
        });
    } catch (error) {
      next(error);
    }
};

