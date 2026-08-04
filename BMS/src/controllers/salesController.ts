import { Request, Response, NextFunction } from "express";
import { createSalesService, 
  getCashierSalesHistoryService, 
  getCashierSalesSummaryService,
  getBusinessRevenueSummaryService,
  getTopSellingProductsService,
  getWeeklySalesOverviewService,
  paymentMethodSplitService,
  getLatestSalesService,
  salesDescriptionService,
  countActiveTerminalService,
  getTopStaffRevenueService
 } from "../services/salesService.js";
 import { countTenantSales } from "../models/midllewareMolde.js";
export const handlePOSCheckout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract the active cashier's user ID from their verified token guard session
    const { id } = (req as any).user;
    // Pull the products list array and payment format sent by your frontend dashboard layout
    const { items, payment_method } = req.body;

    // Execute your high-speed array processing checkout service layer
    const completedInvoice = await createSalesService(id, payment_method, items);
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
    const limitNum = Math.max(1, parseInt(limitStr) || 5);

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


//  get weekly sales overview controkller 
export const getWeeklySalesOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, role } = (req as any).user;
    if (role?.toUpperCase() !== "OWNER") {
      return res.status(403).json({ 
        status: "fail",
        message: "Unauthorized: Access denied. This endpoint is strictly reserved for business owners."
      });
    }

    // 2. TENANT ISOLATION EXPLICIT PASS: Forwards the owner's identification down to the service query matrix
    const weeklyRevenue = await getWeeklySalesOverviewService(id);

    // 3. Return the exact response data object package
    return res.status(200).json({
      status: "success",
      data: {
        weeklyRevenue
      }
    });

  } catch (error: any) {
    // 🔒 Hands execution tracking over cleanly to your global centralized error handler middleware
    return next(error);
  }
};

export const countSalesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Extract identification context injected by your middleware pipeline
    const { businessId } = (req as any).user;
    const activeSub = (req as any).subscription;

    // Guard Clause: Safety fallback if subscription data is missing from the request context
    if (!activeSub || !activeSub.plan) {
      return res.status(400).json({
        status: "fail",
        message: "Subscription Error: Active profile metadata session not found."
      });
    }

    let currentSalesCount = 0;
    const planExpire = activeSub.expired_at
    const planName = activeSub.plan.plan_name?.toUpperCase();

    // 2. CONDITIONAL QUOTA TRIGGER: Track sales count bounds for capped tiers
    if (planName === "FREE_TRIAL" || planName === "BASIC_PLAN") {
      // Passes the business ID and the dynamic timestamp when their current billing month started
      currentSalesCount = await countTenantSales(businessId, activeSub.start_at);
    } else {
      // 🛡️ UNLIMITED PLAN FALLBACK: If they are on a premium or enterprise tier, 
      // we can optionally bypass database counting to maximize performance speeds.
      currentSalesCount = await countTenantSales(businessId, activeSub.start_at);
    }

    // 3. COMPLETE RESPONSE HANDSHAKE: Send analytics payload package to the frontend
    return res.status(200).json({
      status: "success",
      data: {
        plan: planName,
        salesUsedThisMonth: currentSalesCount,
        salesLimitAllowed: planName === "FREE_TRIAL" ? 300 : planName === "BASIC_PLAN" ? 2000 : "UNLIMITED",
        plan_expire:planExpire
      }
    });

  } catch (error: any) {
    // Passes any tracking errors cleanly down to your global error interceptor middleware
    return next(error);
  }
};

//  payment method split controller

export const paymentMethodSplitController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, role } = (req as any).user;

    // 1. 🛡️ ROLE SECURITY GUARD: Blocks non-owners from pulling operational cash metrics
    if (role?.toUpperCase() !== "OWNER") {
      return res.status(403).json({
        status: "fail",
        message: "Unauthorized: Access denied. This endpoint is strictly reserved for business owners."
      });
    }
    const paymentSplit = await paymentMethodSplitService(id);
    return res.status(200).json({
      status: "success",
      data: paymentSplit
    });

  } catch (error: any) {
    return next(error);
  }
};

//  get latest sales controller
export const getLatestSalesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 🔥 FIX: Restored your missing user object parameter extraction context
    const { id, role } = (req as any).user;

    // Safety Gate: Ensure only business owners can access overall historical data lists
    if (role?.toUpperCase() !== "OWNER") {
      return res.status(403).json({
        status: "fail",
        message: "Unauthorized: Access denied. This data list is strictly reserved for business owners."
      });
    }

    const pageStr = req.query.page as string;
    const limitStr = req.query.limit as string;
    
    const page = Math.max(1, parseInt(pageStr) || 1);
    const limit = Math.max(1, parseInt(limitStr) || 5); 

    // Destructure data and counter limits out of your business logic service layer
    const sales = await getLatestSalesService(id, page, limit)

    return res.status(200).json({
      status: "success",
      data:sales.latesSales,
      pagination: sales.pagination
    });

  } catch (error: any) {
    return next(error);
  }
};

// sales Description controllerr

export const handleSalesDecription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { salesId } = req.params;
    const sales_id = salesId.toString()
    if (!salesId) {
      return res.status(400).json({
        status: "fail",
        message: "Validation Error: Missing target transaction identifier code parameter."
      });
    }

    const salesDes = await salesDescriptionService(sales_id);

    if (!salesDes) {
      return res.status(404).json({
        status: "fail",
        message: "Resource Not Found: The requested sales invoice record does not exist."
      });
    }

    return res.status(200).json({
      status: "success",
      data: salesDes
    });

  } catch (error) {
    return next(error);
  }
};


export const getDailyTerminalStaffCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, role } = (req as any).user; // Read identity details from token validation middleware

    // 🛡️ ROLE SECURITY GUARD: Prevents basic operators from checking active shift headcounts
    if (role?.toUpperCase() !== "OWNER") {
      return res.status(403).json({
        status: "fail",
        message: "Unauthorized: Access denied. This endpoint is strictly reserved for business owners."
      });
    }

    const analytics = await countActiveTerminalService(id);

    return res.status(200).json({
      status: "success",
      data: analytics
    });

  } catch (error: any) {
    return next(error);
  }
};

//  revenue leaderboard 
export const getTopStaffRevenueController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, role } = (req as any).user; // The active owner's credentials from token middleware

    // 🛡️ ROLE SECURITY GUARD
    if (role?.toUpperCase() !== "OWNER") {
      return res.status(403).json({
        status: "fail",
        message: "Unauthorized: Access denied. This endpoint is strictly reserved for business owners."
      });
    }

    const topPerformer = await getTopStaffRevenueService(id);

    return res.status(200).json({
      status: "success",
      data: topPerformer
    });

  } catch (error: any) {
    return next(error);
  }
};