import { Router } from "express";
import { handleInitializeSubscriptionPayment, handlePaystackWebhookSettlement } from "../controllers/subscriptionController";
import { verifyAccessToken } from "../middleware/verifyAccessToken"
export const subscriptionRouter = Router()
subscriptionRouter.post("/subscribe", verifyAccessToken, handleInitializeSubscriptionPayment)
subscriptionRouter.post("/subscribe-webhook", handlePaystackWebhookSettlement)