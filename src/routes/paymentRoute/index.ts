import express from "express";
import {
  getBankCodes,
  getAccountDetails,
  initiateOrderPayment,
  verifyPayment,
  handlePaystackWebhook,
  withdrawFunds,
} from "../../controllers/paymentController";
import { verifyToken } from "../../middlewares/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * /api/payment/banks:
 *   get:
 *     tags: [Payment]
 *     summary: Get list of Nigerian bank codes
 *     description: Retrieves all supported bank codes from Paystack.
 *     responses:
 *       200:
 *         description: Bank list retrieved successfully
 *       500:
 *         description: Internal server error
 *
 * /api/payment/account-details:
 *   get:
 *     tags: [Payment]
 *     summary: Verify account details
 *     description: Validates account number and bank code via Paystack.
 *     parameters:
 *       - in: query
 *         name: account_number
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: bank_code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account details verified successfully
 *       400:
 *         description: Missing or invalid account number/bank code
 *       500:
 *         description: Internal server error
 *
 * /api/payment/initiate/{order_id}:
 *   post:
 *     tags: [Payment]
 *     summary: Initiate order payment
 *     description: Initiates payment using Paystack for a specific order.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment initiated successfully
 *       404:
 *         description: Order not found or access denied
 *       500:
 *         description: Internal server error
 *
 * /api/payment/verify/{reference}:
 *   get:
 *     tags: [Payment]
 *     summary: Verify payment
 *     description: Verifies a payment using Paystack reference.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       400:
 *         description: Verification failed
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Internal server error
 *
 * /api/payment/webhook:
 *   post:
 *     tags: [Payment]
 *     summary: Paystack Webhook
 *     description: Handles Paystack webhook events such as `charge.success`, `charge.failed`, `refund.success`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid signature or payload
 *       500:
 *         description: Internal server error
 *
 * /api/payment/withdraw:
 *   post:
 *     tags: [Payment]
 *     summary: Withdraw funds
 *     description: Allows a user to withdraw from their wallet to their linked bank account.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - pin
 *               - accountNumber
 *               - bankCode
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000
 *               pin:
 *                 type: string
 *                 example: "1234"
 *               accountNumber:
 *                 type: string
 *                 example: "0123456789"
 *               bankCode:
 *                 type: string
 *                 example: "058"
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *       400:
 *         description: Validation error or insufficient balance
 *       403:
 *         description: Invalid PIN
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

// Bank-related endpoints
router.get("/banks", getBankCodes);
router.get("/account-details", getAccountDetails);

// Payment-related endpoints (requires authentication)
router.post("/initiate/:order_id", verifyToken, initiateOrderPayment);
router.get("/verify/:reference", verifyToken, verifyPayment);

// Webhook (does not require auth)
router.post("/webhook", handlePaystackWebhook);

// Withdrawal endpoint (requires authentication)
router.post("/withdraw", verifyToken, withdrawFunds);

export default router;
