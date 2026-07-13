import { Request, Response, NextFunction } from "express";
import { getActiveSubscription, countTenantSales } from "../models/midllewareMolde.js";
import { prisma } from "../config/db.js";

export const enforceSubscriptionGate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, role, email } = (req as any).user;
    let businessId = "";

    if (!id) {
      return res.status(401).json({
        status: "fail",
        message: "Unauthorized: Active store tenant session identity context is missing."
      });
    }

    // 1. 💡 Resolve the Multi-Tenant Anchor context based on Role profiles
    if (role !== "OWNER") {
      const me = await prisma.user.findUnique({
        where: { staff_email: email },
        select: { businessId: true }
      });
      // console.log(me)
      if (!me || !me.businessId) {
        return res.status(403).json({
          status: "fail",
          message: "Access Denied: Your staff profile is not linked to any active business workspace directory."
        });
      }
      
      businessId = me.businessId;
    } else {
      // If the user logging in is the primary OWNER, their id represents the businessId anchor channel
      businessId = id;
    }


    // 2. Query the active billing tier details using your clean store tenant keycard
    const activeSub = await getActiveSubscription(businessId);

    if (!activeSub) {
      return res.status(403).json({
        status: "fail",
        code: "SUBSCRIPTION_REQUIRED",
        message: "Access Denied: No active subscription plan found. Please select a plan to unlock your workspace."
      });
    }

    // 3. ⏳ CHECK TIME BOUNDARY: Has the current date crossed the plan's expiration date?
    const currentDate = new Date();
    const expirationDate = new Date(activeSub.expired_at);

    if (currentDate > expirationDate) {
      return res.status(403).json({
        status: "fail",
        code: "PLAN_EXPIRED",
        message: "Access Denied: Your 30-day Free Trial timeline has expired. Please select a paid plan to restore terminal operations."
      });
    }

    // 4. 📊 CHECK USAGE VOLUMES: Evaluate total accumulated invoices matching this shop
    if (activeSub.plan.plan_name === "FREE_TRIAL") {
      // 💡 The Fix: Changed from 'id' to 'businessId' to read global company sales totals!
      const currentSalesCount = await countTenantSales(businessId, activeSub.start_at)

      if (currentSalesCount >= activeSub.plan.max_sales) {
        return res.status(403).json({
          status: "fail",
          code: "USAGE_LIMIT_EXCEEDED",
          message: `Access Denied: You have reached the maximum volume threshold limit of ${activeSub.plan.max_sales} sales receipts allocated to your Free Trial. Please select a plan to continue.`
        });
      }
    }

    if (activeSub.plan.plan_name === "BASIC_PLAN") {
      // 💡 The Fix: Changed from 'id' to 'businessId' to read global company sales totals!
      const currentSalesCount = await countTenantSales(businessId, activeSub.start_at)

      if (currentSalesCount >= activeSub.plan.max_sales) {
        return res.status(403).json({
          status: "fail",
          code: "USAGE_LIMIT_EXCEEDED",
          message: `Access Denied: You have reached the maximum volume threshold limit of ${activeSub.plan.max_sales} sales receipts allocated to your Free Trial. Please select a plan to continue.`
        });
      }
    }

    // ✅ If all criteria clear successfully, pass execution smoothly downward to your controllers
    return next();

  } catch (error) {
    // Forward unexpected exceptions safely to your globalErrorHandler middleware catcher
    return next(error);
  }
};
