import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
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
    callback_url: string
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
}

export default new Paystack();
