export function calculateEarnings(amount: number) {
  const PLATFORM_COMMISSION_RATE = 0.95;
  const GATEWAY_FEE_RATE = 0.015;
  const GATEWAY_FLAT_FEE = 100;

  const gatewayCharges = Math.round(
    amount * GATEWAY_FEE_RATE + GATEWAY_FLAT_FEE
  );
  const totalAmount = amount + gatewayCharges;
  const sellerEarnings = amount * PLATFORM_COMMISSION_RATE;
  const revenue = amount - (amount * PLATFORM_COMMISSION_RATE);

  return {
    totalAmount,
    gatewayCharges,
    sellerEarnings,
    revenue,
  };
}
