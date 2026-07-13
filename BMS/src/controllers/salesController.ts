import { Request, Response, NextFunction } from "express";
import { createSalesService, 
  getCashierSalesHistoryService, 
  getCashierSalesSummaryService,
  getBusinessRevenueSummaryService,
  getTopSellingProductsService,
 } from "../services/salesService.js";
export const handlePOSCheckout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract the active cashier's user ID from their verified token guard session
    const { id } = (req as any).user;
    // Pull the products list array and payment format sent by your frontend dashboard layout
    const { products, payment_method } = req.body;

    // Execute your high-speed array processing checkout service layer
    const completedInvoice = await createSalesService(id, payment_method, products);
    res.status(201).json({
      status: "success",
      message: "Transaction compiled and logged successfully. Invoice generated.",
      data: completedInvoice
    });

  } catch (error) {
    return next(error); // Route to globalErrorHandler middleware cleanly
  }
};

export const handleGetMySalesHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 💡 Security Check: Extract identity strings safely from your verified token payload session
    const {id: userId } = (req as any).user;
    // Parse text strings out of Express req.query, fallback safely to defaults
    const pageStr = req.query.page as string;
    const limitStr = req.query.limit as string;
    const page = Math.max(1, parseInt(pageStr) || 1);
    const limit = Math.max(1, parseInt(limitStr) || 20); // Standardizing on 10 rows per page view

    // Invoke your paginated sales lookup engine service layer
    const historySummaryBundle = await getCashierSalesHistoryService(userId, page, limit);

    // Return the clean records list to your BizFlow frontend data table view
    res.status(200).json({
      status: "success",
      results: historySummaryBundle.allSales.length,
      data: historySummaryBundle.allSales,
      pagination:historySummaryBundle.pagination
    });

  } catch (error) {
    return next(error); 
  }
};

//  get daily, weekly, monthly sales summary
export const handleGetCashierSalesSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract identity properties securely from your active 'verifyAccessToken' token payload session
    const {id: userId } = (req as any).user;

    // Trigger your high-speed cashier specific lookup engine
    const cashierSummaryReport = await getCashierSalesSummaryService(userId);

    return res.status(200).json({
      status: "success",
      message: "Personal terminal sales summaries compiled successfully.",
      data: cashierSummaryReport
    });

  } catch (error) {
   return  next(error); // Automatically route database connection exceptions to your central error handler middleware
  }
};

//  get daily, weekly, monthly income controller
export const handleGetBusinessOwnerRevenueSummary = async (req: Request, res: Response, next: NextFunction)=> {
  try {
    const { id, role } = (req as any).user;

    // 🛡️ Executive Security Gate: Reject access if user is not the official store owner
    if (role !== "OWNER") {
      return res.status(403).json({
        status: "fail",
        message: "Access Denied: Administrative owner profile privileges are required to view full store revenue summaries."
      });
    }

    // Trigger your high-speed store-wide aggregation engine
    const ownerAnalyticsSnapshot = await getBusinessRevenueSummaryService(id);

    return res.status(200).json({
      status: "success",
      message: "Global store revenue analytics compiled successfully.",
      data: ownerAnalyticsSnapshot
    });

  } catch (error) {
   return  next(error); 
  }
};

//  get Top 10 sales Product controller
export const handleGetTopSellingProducts = async (req: Request, res: Response, next: NextFunction)=> {
  try {
    const { id, role } = (req as any).user;

    // 🛡️ Security Gate: Keep high-level store sales metrics hidden from standard cashiers
    if (role !== "OWNER") {
     return  res.status(403).json({
        status: "fail",
        message: "Access Denied: Administrative owner privileges are required to view store product analytics summaries."
      });
    }

    // Parse a dynamic limit choice if sent via the URL query string (e.g., ?limit=10)
    const limitStr = req.query.limit as string;
    const limitNum = Math.max(1, parseInt(limitStr) || 10);

    // Trigger your high-speed aggregation engine
    const topProductsMetrics = await getTopSellingProductsService(id, limitNum);

   return  res.status(200).json({
      status: "success",
      message: "Top selling products statistics compiled successfully.",
      results: topProductsMetrics.length,
      data: topProductsMetrics
    });

  } catch (error) {
    return next(error); 
  }
};


