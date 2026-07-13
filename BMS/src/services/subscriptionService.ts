import { updateSubscription } from "../models/subscriptionModel";
export const updateSubscriptionService = async(businessId:string, plan_name:string, plan_price:string, reference:string) =>{
    const now = new Date()
    const startAtDate = new Date(now);
     const expiredAtDate = new Date(now);
        expiredAtDate.setDate(startAtDate.getDate() + 30); 
        const numericPrice = parseFloat(plan_price) || 0.00;
        let planEnum =""
        let maxStaff = 2;
        let maxSales = 300;
        let trialDays = 30;
        const normalizedInput = String(plan_name).toUpperCase();

        if (normalizedInput.includes("BASIC")) {
            planEnum = "BASIC_PLAN"
            maxStaff = 5;
            maxSales = 2000;
            trialDays = 0; // 💡 Trial days immediately drops to 0 because they are on an active paid plan!
        }

        if (normalizedInput.includes("PRO")) {
            planEnum = "PRO_PLAN"
            maxStaff = 999999; 
            maxSales = 999999;
            trialDays = 0; // 💡 Trial days immediately drops to 0 because they are on an active paid plan!
        }

        const payloadDataBundle = {
                businessId:businessId,
                start_at:    startAtDate,
                expired_at:  expiredAtDate,
                status:      "active", // Syncs lowercase "active" string state flag
                plan_name:   planEnum, // 🚀 Strict type matching SubscriptionPlanTier enum constant!
                plan_price:  numericPrice,
                max_staff:   maxStaff,
                max_sales:   maxSales,
                trial_days:  trialDays,
                amount:      numericPrice,
                reference:   reference,
                currentDate: now
            };

            return await updateSubscription(payloadDataBundle);

}