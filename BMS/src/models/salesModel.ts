import { prisma } from "../config/db.js";
import { logger } from "../config/logger.js";
export const createSalesModel = async (salesData: any) => {

  return await prisma.$transaction(async (tx) => {
    
    // Step 1: Create the single primary master parent sale summary invoice voucher
    const createdSaleHeader = await tx.sale.create({
      data: {
        businessId:     salesData.business_id,
        userId:         salesData.user_id,
        recorded_by:    salesData.staff_name,
        payment_method: salesData.payment_method,
        total_amount:   salesData.total_amount
      }
    });

    const secureSaleId = createdSaleHeader.id;

    // Step 2: Map variables synchronously inside RAM to compile an array of relational child lines
    const saleItemsRows = salesData.products.map((item: any) => ({
      saleId:       secureSaleId, // ✅ Safely links each child row straight to our new parent voucher ID
       productId:   item.productId ? item.productId : null,
      productName:  item.product_name,
      quantity:     parseInt(item.quantity as any),
      unit_price:   Number(item.unit_price),
      total_price:  Number(item.total_price)
    }));

     const batchSummary = await tx.saleItem.createMany({
      data: saleItemsRows
    });
    
    return {
      saleHeader: createdSaleHeader,
      saleItems:  saleItemsRows, // This returns the actual array list holding your names, quantities, and prices!
      meta: {
        itemsInserted: batchSummary.count
      }
    }
  });
};

//  get single staff sales

export const fetchCashierSalesHistoryModel = async (business_id:string, user_id:string, page:number=1, limit:number=20) =>{
  const skip = (page - 1)*limit
  const totalSales = await prisma.sale.count({
    where:{
      userId:user_id,
      businessId:business_id
    }
  })
  const totalPages = Math.ceil(totalSales/limit)
  const allSales = await prisma.sale.findMany({
    where:{
      businessId:business_id,
      userId:user_id
    },
    skip:skip,
    take:limit,
    include:{
      items:true
    },
    orderBy:{
      createdAt:"desc"
    }
  })

  return {
    allSales,
    pagination: {
            totalProducts: totalSales,
            totalPages: totalPages,
            currentPage: page,
            limit: limit,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        }
  }
}

//  get daily , weekly, monthly sales summary
export const fetchCashierRevenueSummaryModel = async (businessId: string, userId: string, startDate: Date) => {
  const aggregationResult = await prisma.sale.aggregate({
    where: {
      businessId: businessId,
      userId:     userId, // 🔒 Cashier Filter Lock: Isolates data strictly to this terminal operator
      createdAt: {
        gte: startDate // Computes only rows created after this checkpoint
      }
    },
    _sum: {
      total_amount: true // Aggregates total revenue taken by this cashier
    },
    _count: {
      id: true // Tallies total customer invoices handled
    }
  });

  return {
    totalRevenue: Number(aggregationResult._sum.total_amount) || 0,
    totalTransactions: aggregationResult._count.id || 0
  };
};

//  get daily, weekly, monthly income model
export const fetchBusinessRevenueAggregationModel = async (businessId: string, startDate: Date) => {
  // 1. Run core sum and count aggregation across the entire store
  const totalAggregation = await prisma.sale.aggregate({
    where: {
      businessId,
      createdAt: { gte: startDate }
    },
    _sum: { total_amount: true },
    _count: { id: true }
  });

  // 2. Run group-by aggregation to break down income by payment method channels
  const paymentBreakdown = await prisma.sale.groupBy({
    by: ['payment_method'],
    where: {
      businessId,
      createdAt: { gte: startDate }
    },
    _sum: { total_amount: true }
  });

  // Extract payment method metrics with clean logical fallbacks to 0
  let cashIncome = 0;
  let cardIncome = 0;
  let transferIncome = 0;

  paymentBreakdown.forEach((bucket) => {
    const sumValue = Number(bucket._sum.total_amount) || 0;
    if (bucket.payment_method === 'CASH') cashIncome = sumValue;
    if (bucket.payment_method === 'CARD') cardIncome = sumValue;
    if (bucket.payment_method === 'TRANSFER') transferIncome = sumValue;
  });

  return {
    totalRevenue: Number(totalAggregation._sum.total_amount) || 0,
    totalTransactions: totalAggregation._count.id || 0,
    breakdown: {
      cash: cashIncome,
      card: cardIncome,
      transfer: transferIncome
    }
  };
};

//  get Top sales products
export const fetchTopSellingProductsModel = async (businessId: string, limit: number = 5) => {
  
  const salesAggregation = await prisma.saleItem.groupBy({
    by: ['productId', 'productName', "unit_price"],
    where: {
      sale: {
        businessId: businessId // 🔒 Tenant Gate: Joins through the parent Sale record to isolate stores
      }
    },
    _sum: {
      quantity: true // Aggregates total items sold for this product
    },
    orderBy: {
      _sum: {
        quantity: 'desc' // Sorts the list from highest volume to lowest volume
      }
    },
    take: limit // Caps the list slice (e.g., Top 5)
  });
//  unit_price
  // 2. Map and clean the raw database output payload for your dashboard charts
   return salesAggregation.map((item) => {
    const totalSold = item._sum.quantity || 0;
    const unitPrice = Number(item.unit_price) || 0; // Ensures Decimal/Float fields cast cleanly to numbers

    return {
      productName: item.productName,
      totalQuantitySold: totalSold,
      totalIncomeGenerated: totalSold * unitPrice 
    };
  });
};

//  Report generating model
export const fetchBusinessReportModel = async (businessId: string, startDate: Date) => {
  return await prisma.$transaction(async (tx) => {
    
    // Pillar 1: Aggregate Traffic, Volume, and Basket Size Averages
    const volumeMetrics = await tx.sale.aggregate({
      where: {
        businessId: businessId,
        createdAt: { gte: startDate }
      },
      _sum: { total_amount: true },
      _count: { id: true },
      _avg: { total_amount: true }
    });

    // Pillar 2: Group and Sum Total Gross Revenue Split by Payment Channels
    const paymentChannels = await tx.sale.groupBy({
      by: ['payment_method'],
      where: {
        businessId: businessId,
        createdAt: { gte: startDate }
      },
      _sum: { total_amount: true }
    });

    // Pillar 3: Rank Highest-Moving Product Lines purely from literal text string logs
    const productVelocity = await tx.saleItem.groupBy({
      by: ['productId', 'productName'], // Groups by text name so unuploaded items don't crash
      where: {
        sale: {
          businessId: businessId, // Relational tenant fence join
          createdAt: { gte: startDate }
        }
      },
      _sum: {
        quantity:    true,
        total_price: true
      },
      orderBy: {
        _sum: { quantity: 'desc' }
      },
      take: 5 // Slices the Top 5 performing items
    });

    // Subsidiary Counter: Pull unique count of items currently in the background catalog
    const catalogCount = await tx.product.count({
      where: { businessId }
    });
    const businessMetadata = await tx.business.findUnique({
      where: { id: businessId },
      select: {
        business_name: true,
        owner_name: true,
      }
    });
    // 📦 Return all calculated database pillars together inside a single structural object tuple
    return {
      volumeMetrics,
      paymentChannels,
      productVelocity,
      catalogCount,
      businessMetadata
    };
  });
};

//  get weekly sales overview model
export const getWeeklySalesOverviewModel = async (businessId:string) =>{
  try{
     const rawData: any[] = await prisma.$queryRaw
      `SELECT 
        EXTRACT(DOW FROM "createdAt") AS day_index,
        TO_CHAR("createdAt", 'Dy') AS day_name,
        SUM("total_amount") AS total_sales 
        FROM "sales"                         
      WHERE "businessId" = ${businessId}
        AND "createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY day_index, day_name
      ORDER BY day_index ASC;
    `;

    return rawData.map((row) => ({
      day_of_week: Number(row.day_index), // Returns numbers 0 (Sunday) through 6 (Saturday)
      day_label: String(row.day_name),    // Returns formatted strings like "Mon", "Tue", "Wed"
      total_sales: Number(row.total_sales) || 0 
    }));
  }catch (error) {
    logger.error("Database layer failed to aggregate weekly revenue:", error);
    throw error; // Re-throw the error so your controller can capture it and send a 500 status
  }
}

// getPaymentMethodSplitsModel
export const getPaymentMethodSplitsModel = async (businessId: string) => {
  const record = await prisma.sale.groupBy({
    by:["payment_method"],
    where:{
      businessId:businessId
    },
     _count: {
        id: true, // Counts how many times each payment method was used
      },
  })

  const totalTransactions = record.reduce((sum, item) => sum + item._count.id, 0);

    if (totalTransactions === 0) {
      return { cashPercentage: 0, posPercentage: 0, transferPercentage: 0 };
    }

    const cashCount = record.find(r => r.payment_method === "CASH")?._count.id || 0;
    const posCount = record.find(r => r.payment_method === "CARD")?._count.id || 0;
    const transferCount = record.find(r => r.payment_method === "TRANSFER")?._count.id || 0;
    return {
      cashPercentage: Math.round((cashCount / totalTransactions) * 100),
      posPercentage: Math.round((posCount / totalTransactions) * 100),
      transferPercentage: Math.round((transferCount / totalTransactions) * 100),
    };
}