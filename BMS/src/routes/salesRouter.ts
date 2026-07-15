import { Router } from "express"
import { verifyAccessToken } from "../middleware/verifyAccessToken"
import { checkSubscriptionActive, enforceSalesLimit } from "../middleware/subscription"
import { validateSalesCheckoutInput } from "../validators/salesValidator"
import { handlePOSCheckout, 
    handleGetMySalesHistory, 
    handleGetCashierSalesSummary,
    handleGetBusinessOwnerRevenueSummary,
    handleGetTopSellingProducts 
} from "../controllers/salesController"
import { enforceIdempotencyKeyGate } from "../middleware/idempotency"
export const saleRouter = Router()
saleRouter.post('/record-sales',  verifyAccessToken,enforceIdempotencyKeyGate, checkSubscriptionActive, enforceSalesLimit, validateSalesCheckoutInput,handlePOSCheckout)
saleRouter.get("/my-sales", verifyAccessToken,  handleGetMySalesHistory);
saleRouter.get('/my-summary', verifyAccessToken, handleGetCashierSalesSummary)
saleRouter.get("/owner-summary", verifyAccessToken, handleGetBusinessOwnerRevenueSummary)
saleRouter.get("/top-products", verifyAccessToken, handleGetTopSellingProducts)
