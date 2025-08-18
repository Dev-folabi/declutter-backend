export function calculateEarnings(amount: number) {
    const PLATFORM_COMMISSION_RATE = 0.1; 
    const GATEWAY_FEE_RATE = 0.015; 
  
    const platformCommission = Math.round(amount * PLATFORM_COMMISSION_RATE);
    const charges = Math.round(amount * GATEWAY_FEE_RATE + 100); 
    const sellerEarnings = amount - platformCommission;
    const netRevenue = platformCommission - charges;
  
    return {
      platformCommission,
      charges,
      sellerEarnings,
      netRevenue
    };
}
  