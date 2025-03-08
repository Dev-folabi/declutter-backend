import { Request, Response, NextFunction } from "express";
import paystack from "../service/paystack";

export const getBankCodes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await paystack.getBankCodes();

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getAccountDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { account_number, bank_code } = req.query;

    if (!account_number || !bank_code) {
      res.status(400).json({
        status: "error",
        message: "Account number and bank code are required",
      });
    }

    const response = await paystack.getAccountDetails(
      account_number as string,
      bank_code as string
    );

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error(
      "Error retrieving account details:",
      error?.response?.data || error.message
    );
    next(error);
  }
};
