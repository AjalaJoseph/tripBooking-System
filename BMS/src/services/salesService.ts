import { createSalesModel, 
  fetchCashierSalesHistoryModel, 
  fetchCashierRevenueSummaryModel,
  fetchBusinessRevenueAggregationModel,
  fetchTopSellingProductsModel,
 } from "../models/salesModel";
import { staffData } from "../models/userModel";
export const createSalesService = async (userId:string,paymentMethod:string, salesData:any[]) =>{
    const staff = await staffData(userId)
    if(!staff){
        throw Object.assign(new Error("Staff workstation profile not found on server grid."), {STATUS_CODES:404})
    }
   let total_amount = 0;
  
  const mappedProducts = salesData.map(item => {
    const calculatedLinePrice = Number(item.unit_price) * parseInt(item.quantity);
    total_amount += calculatedLinePrice;

    return {
      productId:    item.productId || null,
      product_name: item.product_name,
      quantity:     parseInt(item.quantity),
      unit_price:   Number(item.unit_price),
      total_price:  calculatedLinePrice // Automatically injects calculated total per line
    };
  });
    const salesDataPayload ={
        business_id :staff.business.id,
        user_id:staff.id,
        staff_name:staff.staff_name,
        payment_method:paymentMethod,
        total_amount:Number(total_amount),
        products:mappedProducts
    }
     const finalizedInvoiceHeader = await createSalesModel(salesDataPayload);
      return finalizedInvoiceHeader;
}

// get all single cashier sales service
export const getCashierSalesHistoryService = async (userId:string, page:number, limit:number)=>{
  const getBusinessId = await staffData(userId)
  let business_id =""
  if(getBusinessId && getBusinessId.businessId){
    business_id=getBusinessId.businessId
  }
  return await fetchCashierSalesHistoryModel(business_id,userId,page, limit)
}

//  get daily, weekly, monthly sales summary
export const getCashierSalesSummaryService = async ( userId: string) => {
  const now = new Date();
  const getBusinessId = await staffData(userId)
  let business_id =""
  if(getBusinessId && getBusinessId.businessId){
    business_id=getBusinessId.businessId
  }
  // 1. Calculate Daily Boundary (Today from 00:00:00 AM)
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // 2. Calculate Weekly Boundary (Past 7 rolling days from current time)
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - 7);

  // 3. Calculate Monthly Boundary (Past 30 rolling days from current time)
  const startOfThisMonth = new Date(now);
  startOfThisMonth.setDate(now.getDate() - 30)

  const startOfThisYear = new Date(now);
  startOfThisYear.setDate(now.getDate() - 365);

  // 🚀 Fire all three aggregations concurrently across your Prisma Connection Pool to save time!
  const [dailyMetrics, weeklyMetrics, monthlyMetrics, yearlyMetrics] = await Promise.all([
    fetchCashierRevenueSummaryModel(business_id, userId, startOfToday),
    fetchCashierRevenueSummaryModel(business_id, userId, startOfThisWeek),
    fetchCashierRevenueSummaryModel(business_id, userId, startOfThisMonth),
    fetchCashierRevenueSummaryModel(business_id,userId,startOfThisYear)
  ]);

  // Return a clean summary object tailored for the cashier's workstation terminal view
  return {
    cashierId: userId,
    daily: {
      period: "My Sales Today (Since 00:00 AM)",
      revenue: dailyMetrics.totalRevenue,
      transactions: dailyMetrics.totalTransactions
    },
    weekly: {
      period: "My Sales Last 7 Days Rolling Window",
      revenue: weeklyMetrics.totalRevenue,
      transactions: weeklyMetrics.totalTransactions
    },
    monthly: {
      period: "My Sales Last 30 Days Rolling Window",
      revenue: monthlyMetrics.totalRevenue,
      transactions: monthlyMetrics.totalTransactions
    },
    yearly: {
      period: "My Sales Last 365 Days Rolling Window",
      revenue: yearlyMetrics.totalRevenue,
      transactions: yearlyMetrics.totalTransactions
    }
  };
}

//  get daily, weekly, monthly income service
export const getBusinessRevenueSummaryService = async (businessId: string) => {
  const now = new Date();

  // 1. Calculate Daily Boundary (Today from 00:00:00 AM)
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // 2. Calculate Weekly Boundary (Past 7 rolling days from current time)
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - 7);

  // 3. Calculate Monthly Boundary (Past 30 rolling days from current time)
  const startOfThisMonth = new Date(now);
  startOfThisMonth.setDate(now.getDate() - 30);
   const startOfThisYear = new Date(now);
  startOfThisYear.setDate(now.getDate() - 365);

  // 🚀 Fire all aggregations concurrently to hit sub-20ms database response speeds
  const [dailyData, weeklyData, monthlyData, yearlyData] = await Promise.all([
    fetchBusinessRevenueAggregationModel(businessId, startOfToday),
    fetchBusinessRevenueAggregationModel(businessId, startOfThisWeek),
    fetchBusinessRevenueAggregationModel(businessId, startOfThisMonth),
    fetchBusinessRevenueAggregationModel(businessId,startOfThisYear)
  ]);

  return {
    businessId,
    daily: {
      period: "Total Store Revenue Today (Since 00:00 AM)",
      total_income: dailyData.totalRevenue,
      total_transactions: dailyData.totalTransactions,
      payment_channels: dailyData.breakdown
    },
    weekly: {
      period: "Total Store Revenue Last 7 Days Window",
      total_income: weeklyData.totalRevenue,
      total_transactions: weeklyData.totalTransactions,
      payment_channels: weeklyData.breakdown
    },
    monthly: {
      period: "Total Store Revenue Last 30 Days Window",
      total_income: monthlyData.totalRevenue,
      total_transactions: monthlyData.totalTransactions,
      payment_channels: monthlyData.breakdown
    },
    yearly: {
      period: "Total Store Revenue Last 365 Days Window",
      total_income: yearlyData.totalRevenue,
      total_transactions: yearlyData.totalTransactions,
      payment_channels: yearlyData.breakdown
    }
  };
};

//  get Top sales product
export const getTopSellingProductsService = async (businessId: string, limit: number ) => {

  return await fetchTopSellingProductsModel(businessId, limit);
};

//  generate report
