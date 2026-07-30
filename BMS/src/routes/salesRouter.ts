import { Router } from "express"
import { verifyAccessToken } from "../middleware/verifyAccessToken"
import { checkSubscriptionActive, enforceSalesLimit } from "../middleware/subscription"
import { validateSalesCheckoutInput } from "../validators/salesValidator"
import { handlePOSCheckout, 
    handleGetMySalesHistory, 
    handleGetCashierSalesSummary,
    handleGetBusinessOwnerRevenueSummary,
    handleGetTopSellingProducts,
    getWeeklySalesOverview, 
    paymentMethodSplitController,
    getLatestSalesController,
    handleSalesDecription,
    getDailyTerminalStaffCount,
    getTopStaffRevenueController
} from "../controllers/salesController"
import { enforceIdempotencyKeyGate } from "../middleware/idempotency"
export const saleRouter = Router()
saleRouter.post('/record-sales',  verifyAccessToken,enforceIdempotencyKeyGate, checkSubscriptionActive, enforceSalesLimit, validateSalesCheckoutInput,handlePOSCheckout)
saleRouter.get("/my-sales", verifyAccessToken,  handleGetMySalesHistory);
saleRouter.get('/my-summary', verifyAccessToken, handleGetCashierSalesSummary)
saleRouter.get("/overview", verifyAccessToken, handleGetBusinessOwnerRevenueSummary)
saleRouter.get("/top-products", verifyAccessToken, handleGetTopSellingProducts)
saleRouter.get("/weekly-overview", verifyAccessToken, getWeeklySalesOverview)
saleRouter.get("/payment-splits", verifyAccessToken, paymentMethodSplitController)
saleRouter.get("/latest-sales", verifyAccessToken, getLatestSalesController);
saleRouter.get("/:salesId/sales-description", verifyAccessToken, handleSalesDecription);
saleRouter.get("/active-terminal", verifyAccessToken, getDailyTerminalStaffCount)
saleRouter.get("/staff-leaderboard", verifyAccessToken, getTopStaffRevenueController)