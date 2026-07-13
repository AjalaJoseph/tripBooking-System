import { Router } from "express"
import { verifyAccessToken } from "../middleware/verifyAccessToken"
import { enforceSubscriptionGate } from "../middleware/subscription"
import { validateSalesCheckoutInput } from "../validators/salesValidator"
import { handlePOSCheckout, 
    handleGetMySalesHistory, 
    handleGetCashierSalesSummary,
    handleGetBusinessOwnerRevenueSummary,
    handleGetTopSellingProducts 
} from "../controllers/salesController"
export const saleRouter = Router()
saleRouter.post('/record-sales', verifyAccessToken, enforceSubscriptionGate, validateSalesCheckoutInput,handlePOSCheckout)
saleRouter.get("/my-sales", verifyAccessToken, enforceSubscriptionGate, handleGetMySalesHistory);
saleRouter.get('/my-summary', verifyAccessToken, handleGetCashierSalesSummary)
saleRouter.get("/owner-summary", verifyAccessToken, handleGetBusinessOwnerRevenueSummary)
saleRouter.get("/top-products", verifyAccessToken, handleGetTopSellingProducts)
