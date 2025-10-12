import { Types } from "mongoose";

/**
 * Generates a unique reference ID for a transaction.
 * @param orderId - The ID of the order to generate a reference for.
 * @returns A unique reference ID string.
 */
export const generateReferenceId = (orderId: Types.ObjectId): string => {
  const timestamp = new Date().getTime();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `TX-${orderId.toString()}-${timestamp}-${randomSuffix}`;
};
