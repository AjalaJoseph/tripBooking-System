import { Request, Response, NextFunction } from "express";
import axios from "axios"
import crypto from "crypto";
import dotenv from "dotenv"
import { logger } from "../config/logger";
import { runWithPaystackBreaker } from "../ultil/paystackBreaker";
import { getPaymentService, updateSubscriptionService } from "../services/subscriptionService";
dotenv.config()
const PAYSTACK_KEY = process.env.PAYSTACK_SECRET_KEY || " "
export const handleInitializeSubscriptionPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try{
        
        const {id, email} = (req as any).user
        const { plan_name,  callback_url } = req.body;

    // 🛡️ 1. SERVER-SIDE PRICE ENFORCEMENT MATRIX (Prevents frontend tamper injection attacks)
        let amountInKobo = 0;
        if (plan_name.toUpperCase() === "BASIC_PLAN") {
          amountInKobo = 5000 * 100; // Paystack charges strictly in KOBO (Sub-units: ₦5,000 = 500000 kobo)
        } else if (plan_name.toUpperCase() === "PRO_PLAN") {
          amountInKobo = 10000 * 100; // ₦10,000 = 1000000 kobo
        } else {
          res.status(400).json({ status: "fail", message: "Validation Error: Unknown plan package selection string identifier." });
          return;
        }
         const PaystackPayload ={
            email:email,
            amount: Number(amountInKobo), // Frontend redirect post-payment
            // channels: ["card"], 
            callback_url:callback_url,
           metadata: { 
              businessId: id,          // Renamed to businessId to match model schema parameters perfectly
              plan_name:  plan_name,   // Triggers your case-insensitive uppercase enum converters seamlessly
              plan_price: amountInKobo
            }
         }
        const paystackResponse = await runWithPaystackBreaker(() =>
            axios.post("https://api.paystack.co/transaction/initialize",
              PaystackPayload,
              {
                headers: {
                  Authorization: `Bearer ${PAYSTACK_KEY}`,
                  "Content-Type": "application/json",
                },
                timeout: 30000 ,
              }
            )
          );
          
          if (paystackResponse.data && paystackResponse.data.status === true) {
                res.status(200).json({
                    status: "success",
                    message: "Paystack secure checkout url link generated successfully.",
                    data: {
                    authorization_url: paystackResponse.data.data.authorization_url,
                    reference: paystackResponse.data.data.reference
                    }
                });
            } else {
            res.status(502).json({ status: "fail", message: "Bad Gateway: Paystack token service failed." });
            }
    }catch (error: any) {
      logger.error("PAYSTACK RESPONSE", {
        status: error?.response?.status,
        data: error?.response?.data
      });

      next(error);
    }
}

export const handlePaystackWebhookSettlement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    logger.info("📋 COMPLETE LIST OF HEADERS RECEIVED BY YOUR ENDPOINT:");
    const incomingSignature = req.headers['x-paystack-signature'] as string;
    const rawPayloadText = (req as any).rawBody;
    if (!rawPayloadText || !incomingSignature) {
      res.status(400).json({ status: "fail", message: "Bad Request: Missing cryptographic payload context vectors." });
      return;
    }
     const computedHash = crypto
      .createHmac("sha512", PAYSTACK_KEY)
      .update(rawPayloadText) // 🚀 Success: Passes the exact, un-mutated raw text stream data!
      .digest("hex");

    if (incomingSignature !== computedHash) {
      logger.warn("❌ [SECURITY ALERT]: Verification signature payload mismatch! Dropping packet.");
      res.status(401).json({ status: "fail", message: "Unauthorized: Invalid signature origin source." });
      return;
    }
    const eventPayload = req.body;
    // Check if credit card charge cleared successfully on Paystack network nodes
    if (eventPayload && eventPayload.plan_name && !eventPayload.event) {
      logger.warn("⚠️ [Routing Lane Collision]: Frontend/test script hit webhook route instead of subscribe path.");
      res.status(400).json({
        status: "fail",
        message: "Incorrect Endpoint Configuration: Please target /api/subscribe for plan selections, not the webhook route."
      });
      return; // 🔥 Explicitly halts execution instantly!
    }

    if (eventPayload && eventPayload.event === "charge.success") {
      logger.info(`💰 [Paystack Webhook Success]: Intercepted authentic card charge token.`);
      const transactionData = eventPayload.data;
      
      // 🎯 THE ANTI-CRASH FIX: Explicitly safe-guard metadata targets to prevent undefined crashes [S4]
      const metadata = transactionData?.metadata || {};
      const businessId = metadata.businessId 
      const planName = metadata.plan_name 
        const gatewayReference = transactionData?.reference; 
      
      // Convert Kobo parameter integers back to Naira floating decimal values smoothly (e.g. 500000 -> 5000.00) [S4]
      const rawAmount = Number(transactionData?.amount || 0);
      const plan_price = (rawAmount / 100).toFixed(2)
      if (!businessId) {
        logger.warn(`ℹ️ Webhook Acknowledged: Payment cleared but ignored due to missing business metadata context.`);
        res.status(200).send("Webhook Handled Cleanly (No business metadata available).");
        return;
      }

      logger.info(`🆙 [BizFlow Billing]: Activating data service layers for business profile [${businessId}]...`);
      

       await updateSubscriptionService(businessId, planName, plan_price, gatewayReference);
      logger.info(`💸 Summary: Verified receipt reference #${gatewayReference} tracking a sum value of ₦${plan_price} for plan [${planName}].`);
    }

    res.status(200).send("Webhook Handled Cleanly.");

  } catch (error) {
    next(error);
  }
};

//  payment data retriever controller
export const handleGetPaymentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 💡 THE SECURITY SHIELD: Extract the corporate businessId, NOT the individual user ID string!
    const { id } = (req as any).user;

    if (!id) {
      res.status(401).json({ 
        status: "fail", 
        message: "Unauthorized: Access Denied. Valid business workspace context missing." 
      });
      return;
    }

    // Call your payment history data extractor service passing the locked corporate anchor parameter
    const getPayment = await getPaymentService(id);

    // 🚀 CLEAN UNIFIED RESPONSE: Fires exactly once, satisfying Promise<void> parameters
    res.status(200).json({
      status: "success",
      message: "Business subscription billing ledger histories retrieved successfully.",
      data: getPayment
    });
    return;

  } catch (error) {
    // Passes system exceptions down to your central global error handling middleware pipelines cleanly
    next(error);
  }
};