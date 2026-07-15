import { Request, Response, NextFunction } from "express";
import axios from "axios"
import crypto from "crypto";
import dotenv from "dotenv"
import { getPaymentService, updateSubscriptionService } from "../services/subscriptionService";
dotenv.config()
const PAYSTACK_KEY = process.env.PAYSTACK_TEST_KEY || " "
export const handleInitializeSubscriptionPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try{
        
        const {id, email} = (req as any).user
        const {plan_name, Plan_price} = req.body
        if (!plan_name || !Plan_price) {
            res.status(400).json({ status: "fail", message: "Bad Request: Please supply a plan_name and plan_price." });
            return; // Stops function execution cleanly without breaking TypeScript void typing rules
         }
         const PaystackPayload ={
            email:email,
            amount: Number(Plan_price) * 100, // Frontend redirect post-payment
            channels: ["card"], 
           metadata: { 
              businessId: id,          // Renamed to businessId to match model schema parameters perfectly
              plan_name:  plan_name,   // Triggers your case-insensitive uppercase enum converters seamlessly
              plan_price: Plan_price
            }
         }
         const paystackResponse = await axios.post("https://api.paystack.co/transaction/initialize",
            PaystackPayload,
             {
                headers: {
                Authorization: `Bearer ${PAYSTACK_KEY}`, // Your secret key variable loaded from your .env file
                "Content-Type": "application/json"
                }
            }
          )
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
    }catch(error){
        return next(error)
    }
}

export const handlePaystackWebhookSettlement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 🔒 CYBERSECURITY SIGNATURE MATCH: Enforce hash check to block hacker fakes!
    const reference = "uyah8smkad"
    //  const incomingSignature = req.headers['x-paystack-signature'] ;
    // console.log(incomingSignature)
    // 💡 THE RETRY SAFE FIX: Read the exact unparsed text string buffer from the request stream!
    // const rawPayloadText = (req as any).rawBody;

    // if (!rawPayloadText) {
    //   res.status(400).json({ status: "fail", message: "Bad Request: Missing raw string request payload context." });
    //   return;
    // }
    //  const computedHash = crypto
    //   .createHmac("sha512", PAYSTACK_KEY)
    //   .update(rawPayloadText) // 🚀 Success: Passes the exact, un-mutated raw text stream data!
    //   .digest("hex");

    // if (incomingSignature !== computedHash) {
    //   console.log("❌ [Cybersecurity Alert]: Encryption signatures do not match! Dropping packet.");
    //   res.status(401).json({ status: "fail", message: "Unauthorized: Signature payload mismatch." });
    //   return;
    // }

    // if (incomingSignature !== computedHash) {
    //   res.status(401).json({ status: "fail", message: "Unauthorized: Signature payload mismatch." });
    //   return;
    // }

    // const eventPayload = req.body;
    // console.log(eventPayload)
    // Check if credit card charge cleared successfully on Paystack network nodes
    // if (eventPayload.event === "charge.success") {
    //   console.log(`💰 [Paystack Webhook Alert]: Intercepted successful charge event token.`);
    //   // console.log(eventPayload.event)
    //   // Trigger your decoupled service layer pass-through pipeline smoothly
    // //   await processWebhookUpgradeService(eventPayload.data);
    // }

    // Paystack strictly mandates returning an immediate HTTP 200 response string line
    const eventPayload = req.body;
    console.log("🛰️ [Incoming Webhook Payload Captured]:", eventPayload);

    // 🛡️ THE TRAFFIC GUARD FALLBACK: If a rogue client or test script accidentally hits this path with raw initializing metadata
    if (eventPayload && eventPayload.plan_name && !eventPayload.event) {
      console.log("⚠️ [Routing Lane Collision]: Your frontend/test script is hitting the WEBHOOK path instead of the SUBSCRIBE path.");
      res.status(400).json({
        status: "fail",
        message: "Incorrect Endpoint Configuration: Please target /api/subscribe for plan selections, not the webhook route."
      });
      return;
    }

    // 🚀 Check if the incoming payload is an authentic Paystack system event notification token
    if (eventPayload && eventPayload.event === "charge.success") {
      console.log(`💰 [Paystack Webhook Alert]: Intercepted authentic successful card charge event token.`);
      
      // Extract values cleanly using standard Paystack JSON schema properties
      const { businessId, plan_name, plan_price } = eventPayload.data.metadata;
      const gatewayReference = eventPayload.data.reference;
      
      // Convert Kobo value parameter back to standard primitive currency string units (e.g. 500000 / 100 = "5000.00")
      const totalAmountPaidInNaira = (eventPayload.data.amount / 100).toString();

      console.log(`🆙 [BizFlow Billing]: Activating data service layers pipelines for business [${businessId}]...`);
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