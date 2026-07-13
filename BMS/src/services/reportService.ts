import { fetchBusinessReportModel } from "../models/salesModel";
export const generateReportService = async (businessId: string, startDate:string) => {
  const now = new Date();
  // Convert the incoming frontend text string into a real JavaScript Date object
  const parsedStartDate = new Date(startDate);
  // Fall-safe check: If frontend sends a corrupt date string, default gracefully to past 7 days
  if (isNaN(parsedStartDate.getTime())) {
    parsedStartDate.setDate(now.getDate() - 7);
  }
  // 1. Trigger the single, combined database execution block
  const rawReportData = await fetchBusinessReportModel(businessId, parsedStartDate);
  // 2. Map and parse payment channels dynamically with clean fallbacks to 0
  let cardIncome = 0;
  let transferIncome = 0;
  let cashIncome =0

  rawReportData.paymentChannels.forEach((bucket) => {
    const sumValue = Number(bucket._sum.total_amount) || 0;
     const currentMethod = String(bucket.payment_method).toUpperCase();

    if (currentMethod === 'CASH') cashIncome = sumValue;
    if (currentMethod === 'CARD')  cardIncome = sumValue;
    if (currentMethod === 'TRANSFER') transferIncome = sumValue;
  });

  // 3. Clean and map your top products text log array rows smoothly
  const cleanTopProducts = rawReportData.productVelocity.map((item) => ({
    productName: item.productName,
    unitsSold: item._sum.quantity || 0,
    revenueGenerated: Number(item._sum.total_price) || 0
  }));

  const resolvedBusinessName = rawReportData.businessMetadata?.business_name 
  const resolvedOwnerName = rawReportData.businessMetadata?.owner_name

  // 4. Compile your final unified professional report structure
  return {
    report_type: "Dynamic Business Performance Summary",
    generated_at: now,
    timeline: {
      from: parsedStartDate,
      to: now
    },
    // 💡 NEW METADATA KEY ENHANCEMENTS ADDED HERE!
    business_context: {
      company_name: resolvedBusinessName,
      owner_name:   resolvedOwnerName
    },
    traffic_and_volume: {
      total_receipts_issued: rawReportData.volumeMetrics._count.id || 0,
      average_basket_value: Number(rawReportData.volumeMetrics._avg.total_amount) || 0,
      gross_sales_volume: Number(rawReportData.volumeMetrics._sum.total_amount) || 0
    },
    gross_revenue_tracking: {
      cash_payouts :cashIncome,
      card_payouts: cardIncome,
      transfer_payouts: transferIncome
    },
    product_performance: {
      total_catalog_items: rawReportData.catalogCount, // Safely reads 0 if no products uploaded
      highest_moving_items: cleanTopProducts
    }
  };
};