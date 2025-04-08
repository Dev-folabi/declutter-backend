import { Request, Response, NextFunction } from "express";
import { WeListened} from '../models/weListened';
import { User } from "../models/userModel";
import { getIdFromToken } from "../function/token";



export const createWeListened = async (
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
                
        const newWeListened = await WeListened.create(req.body);
        res.status(201).json({
            success: true,
            message: "Your message has been created successfully.",
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
            res.status(404).json({ message: 'WeListened not found' });
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

        const { id } = req.params;
        const updatedWeListened = await WeListened.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updatedWeListened) {
            res.status(404).json({
                success: false,
                message: 'WeListened not found',
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
        const deletedWeListened = await WeListened.findByIdAndDelete(req.params.id);
        if (!deletedWeListened) {
            return res.status(404).json({
                success : false,
                message: 'WeListened not found'
            });
        }
        res.status(200).json({
            success : true,
            message: 'WeListened deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

export const removeWeListened = async (
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
    
    const data = await WeListened.findByIdAndDelete(req.params.id);
    if (!data) {
        res.status(404).json({
            success : false,
            message: 'WeListened not found',
            data: null,
        });
    }
    res.status(204).json({
        success: true,
        message: "Your message has been deleted successfully.",
        data: null,
    });
} catch (error) {
    next(error);
}
};
