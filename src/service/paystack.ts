import axios from "axios";
import dotenv from "dotenv";
import { getEnvironment } from "../function/environment";

dotenv.config();

const environment = getEnvironment();

const PAYSTACK_SECRET_KEY =
  environment === "local" || "staging"
    ? process.env.PAYSTACK_TEST_SECRET_KEY!
    : process.env.PAYSTACK_LIVE_SECRET_KEY!;

const PAYMENT_CALLBACK_URL =
  environment === "local" || "staging"
    ? process.env.PAYMENT_TEST_CALLBACK_URL!
    : process.env.PAYMENT_LIVE_CALLBACK_URL!;

const PAYSTACK_BASE_URL =
  process.env.PAYSTACK_BASE_URL || "https://api.paystack.co";

class Paystack {
  private headers = {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };

  /**
   * Get a list of bank codes
   */
  async getBankCodes() {
    try {
      const response = await axios.get(`${PAYSTACK_BASE_URL}/bank`, {
        headers: this.headers,
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || "Failed to fetch bank codes"
      );
    }
  }

  /**
   * Retrieve account details using account number & bank code
   */
  async getAccountDetails(account_number: string, bank_code: string) {
    if (!account_number || !bank_code) {
      throw new Error("Account number and bank code are required");
    }

    try {
      const response = await axios.get(`${PAYSTACK_BASE_URL}/bank/resolve`, {
        params: { account_number, bank_code },
        headers: this.headers,
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || "Failed to retrieve account details"
      );
    }
  }

  /**
   * Initiate a payment
   */
  async initiatePayment(
    email: string,
    amount: number,
    reference: string,
    callback_url = PAYMENT_CALLBACK_URL
  ) {
    try {
      const response = await axios.post(
        `${PAYSTACK_BASE_URL}/transaction/initialize`,
        { email, amount: amount * 100, reference, callback_url },
        { headers: this.headers }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || "Failed to initiate payment"
      );
    }
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(reference: string) {
    try {
      const response = await axios.get(
        `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
        {
          headers: this.headers,
        }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || "Failed to verify payment"
      );
    }
  }

  /**
   * Create a Transfer Recipient
   */
  async createRecipient(
    //  name: string,
    account_number: string,
    bank_code: string
  ) {
    try {
      const response = await axios.post(
        `${PAYSTACK_BASE_URL}/transferrecipient`,
        {
          type: "nuban",
          account_number,
          bank_code,
          currency: "NGN",
        },
        { headers: this.headers }
      );

      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || "Failed to create recipient"
      );
    }
  }

  /**
   * Transfer money to a recipient
   */
  async transferFunds(recipient_code: string, amount: number, reason: string) {
    try {
      const response = await axios.post(
        `${PAYSTACK_BASE_URL}/transfer`,
        {
          source: "balance",
          recipient: recipient_code,
          amount: amount * 100,
          reason,
        },
        { headers: this.headers }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || "Failed to transfer funds"
      );
    }
  }

  /**
   * Process a refund for a transaction
   */
  async processRefund(transactionReference: string, amount?: number, merchantNote?: string) {
    try {
      const refundData: any = {
        transaction: transactionReference,
      };
      
      if (amount) {
        refundData.amount = amount * 100; // Convert to kobo
      }
      
      if (merchantNote) {
        refundData.merchant_note = merchantNote;
      }

      const response = await axios.post(
        `${PAYSTACK_BASE_URL}/refund`,
        refundData,
        { headers: this.headers }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || "Failed to process refund"
      );
    }
  }

  /**
   * Get refund details
   */
  async getRefundDetails(refundId: string) {
    try {
      const response = await axios.get(
        `${PAYSTACK_BASE_URL}/refund/${refundId}`,
        { headers: this.headers }
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || "Failed to get refund details"
      );
    }
  }
}

export default new Paystack();
