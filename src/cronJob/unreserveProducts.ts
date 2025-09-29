import { Product } from "../models/productList";

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

export const unreserveExpiredProducts = async () => {
  const oneHourAgo = new Date(Date.now() - ONE_HOUR_IN_MS);

  try {
    console.log("🔄 Running job to un-reserve expired products...");

    const result = await Product.updateMany(
      {
        is_reserved: true,
        reserved_at: { $lte: oneHourAgo },
      },
      {
        $set: { is_reserved: false },
        $unset: { reserved_at: "" },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Un-reserved ${result.modifiedCount} product(s).`);
    } else {
      console.log("👍 No expired reservations found.");
    }
  } catch (err: any) {
    console.error("❌ Error in un-reserving products job:", err.message);
  }
};