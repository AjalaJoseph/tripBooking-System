

import { Request, Response, NextFunction } from "express";
import { getActiveSubscription, countTenantSales, countStaffRegister } from "../models/midllewareMolde";
import { prisma } from "../config/db";

export const checkSubscriptionActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, role, email } = (req as any).user;
    let businessId = "";

    if (!id) {
      res.status(401).json({
        status: "fail",
        message: "Unauthorized: Active store tenant session identity context is missing."
      });
      return;
    }

    // 1. Resolve Multi-Tenant Anchor based on Role profiles
    if (role.toUpperCase() !== "OWNER") {
      const staffMember = await prisma.user.findUnique({
        where: { staff_email: email },
        select: { businessId: true }
      });

      if (!staffMember || !staffMember.businessId) {
        res.status(403).json({
          status: "fail",
          message: "Access Denied: Your staff profile is not linked to any active business workspace directory."
        });
        return;
      }
      businessId = staffMember.businessId;
    } else {
      businessId = id;
    }

    // 2. Query active billing tier details
    const activeSub = await getActiveSubscription(businessId);
    if (!activeSub) {
      res.status(403).json({
        status: "fail",
        code: "SUBSCRIPTION_REQUIRED",
        message: "Access Denied: No active subscription plan found. Please select a plan to unlock your workspace."
      });
      return;
    }

    // 3. Check calendar date time boundary boundaries
    const currentDate = new Date();
    const expirationDate = new Date(activeSub.expired_at);

    if (currentDate > expirationDate) {
      res.status(403).json({
        status: "fail",
        code: "PLAN_EXPIRED",
        message: `Access Denied: Your ${activeSub.plan.plan_name.replace('_', ' ')} timeline has expired. Please process a subscription renewal to restore operations.`
      });
      return;
    }

    // 💡 ATTACH TO REQUEST STREAM: Downstream middleware gates can read these values instantly!
    (req as any).user.businessId = businessId;
    (req as any).subscription = activeSub;

    return next();
  } catch (error) {
   return  next(error);
  }
};

export const enforceSalesLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { businessId } = (req as any).user;
    const activeSub = (req as any).subscription;

    if (activeSub.plan.plan_name === "FREE_TRIAL" || activeSub.plan.plan_name === "BASIC_PLAN") {
      const currentSalesCount = await countTenantSales(businessId, activeSub.start_at);

      if (currentSalesCount >= activeSub.plan.max_sales) {
        res.status(403).json({
          status: "fail",
          code: "USAGE_LIMIT_EXCEEDED",
          message: `Access Denied: You have reached the maximum volume threshold limit of ${activeSub.plan.max_sales} sales receipts allocated to your current plan tier. Please upgrade your plan variables to unlock unlimited transactions.`
        });
        return;
      }
    }

    return next();
  } catch (error) {
    next(error);
  }
};


export const enforceStaffLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { businessId } = (req as any).user;
    const activeSub = (req as any).subscription;

    if (activeSub.plan.plan_name === "FREE_TRIAL") {
      const staffCount = await countStaffRegister(businessId);
      if (staffCount >= activeSub.plan.max_staff) {
        res.status(403).json({
          status: "fail",
          code: "STAFF_LIMIT_EXCEEDED",
          message: `Access Denied: You have reached the maximum threshold limit of ${activeSub.plan.max_staff} registered staff accounts allocated to your Free Trial workspace.`
        });
        return;
      }
    }

    if (activeSub.plan.plan_name === "BASIC_PLAN") {
      const staffCount = await countStaffRegister(businessId);
      if (staffCount >= activeSub.plan.max_staff) {
        res.status(403).json({
          status: "fail",
          code: "STAFF_LIMIT_EXCEEDED",
          message: `Access Denied: You have reached the maximum threshold limit of ${activeSub.plan.max_staff} registered staff accounts allocated to your Basic Plan subscription. Please upgrade to Pro for unlimited team slots.`
        });
        return;
      }
    }

    return next();
  } catch (error) {
    next(error);
  }
};