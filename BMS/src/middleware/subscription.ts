// import { Request, Response, NextFunction } from "express";
// import { getActiveSubscription, countTenantSales, countStaffRegister } from "../models/midllewareMolde.js";
// import { prisma } from "../config/db.js";

// export const enforceSubscriptionGate = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { id, role, email } = (req as any).user;
//     let businessId = "";

//     if (!id) {
//       return res.status(401).json({
//         status: "fail",
//         message: "Unauthorized: Active store tenant session identity context is missing."
//       });
//     }

//     // 1. 💡 Resolve the Multi-Tenant Anchor context based on Role profiles
//     if (role !== "OWNER") {
//       const me = await prisma.user.findUnique({
//         where: { staff_email: email },
//         select: { businessId: true }
//       });
//       // console.log(me)
//       if (!me || !me.businessId) {
//         return res.status(403).json({
//           status: "fail",
//           message: "Access Denied: Your staff profile is not linked to any active business workspace directory."
//         });
//       }
      
//       businessId = me.businessId;
//     } else {
//       // If the user logging in is the primary OWNER, their id represents the businessId anchor channel
//       businessId = id;
//     }


//     // 2. Query the active billing tier details using your clean store tenant keycard
//     const activeSub = await getActiveSubscription(businessId);

//     if (!activeSub) {
//       return res.status(403).json({
//         status: "fail",
//         code: "SUBSCRIPTION_REQUIRED",
//         message: "Access Denied: No active subscription plan found. Please select a plan to unlock your workspace."
//       });
//     }

//     // 3. ⏳ CHECK TIME BOUNDARY: Has the current date crossed the plan's expiration date?
//     const currentDate = new Date();
//     const expirationDate = new Date(activeSub.expired_at);

//     if (currentDate > expirationDate) {
//       return res.status(403).json({
//         status: "fail",
//         code: "PLAN_EXPIRED",
//         message: "Access Denied: Your 30-day Free Trial timeline has expired. Please select a paid plan to restore terminal operations."
//       });
//     }

//     // 4. 📊 CHECK USAGE VOLUMES: Evaluate total accumulated invoices matching this shop
//     if (activeSub.plan.plan_name === "FREE_TRIAL") {
//       // 💡 The Fix: Changed from 'id' to 'businessId' to read global company sales totals!
//       const currentSalesCount = await countTenantSales(businessId, activeSub.start_at)

//       if (currentSalesCount >= activeSub.plan.max_sales) {
//         return res.status(403).json({
//           status: "fail",
//           code: "USAGE_LIMIT_EXCEEDED",
//           message: `Access Denied: You have reached the maximum volume threshold limit of ${activeSub.plan.max_sales} sales receipts allocated to your Free Trial. Please select a plan to continue.`
//         });
//       }
//     }

//      if (activeSub.plan.plan_name === "FREE_TRIAL") {
//       const staffCount = await countStaffRegister(businessId);

//       if (staffCount >= activeSub.plan.max_staff) {
//         res.status(403).json({
//           status: "fail",
//           code: "STAFF_LIMIT_EXCEEDED",
//           // 💡 FIXED: Dynamically injects the correct max_staff value parameter string!
//           message: `Access Denied: You have reached the maximum threshold limit of ${activeSub.plan.max_staff} registered staff accounts allocated to your Free Trial workspace. Please upgrade your plan to onboard more terminal operators.`
//         });
//         return;
//       }
//     }

//     // 🆕 2. BASIC PLAN ENVIRONMENT LIMIT CHECK
//     if (activeSub.plan.plan_name === "BASIC_PLAN") {
//       const staffCount = await countStaffRegister(businessId);

//       if (staffCount >= activeSub.plan.max_staff) {
//         res.status(403).json({
//           status: "fail",
//           code: "STAFF_LIMIT_EXCEEDED",
//           // 💡 FIXED: Removed "Free Trial" phrasing and mapped text strictly to the Basic Plan tier parameters!
//           message: `Access Denied: You have reached the maximum threshold limit of ${activeSub.plan.max_staff} registered staff accounts allocated to your Basic Plan subscription. Please upgrade to the Pro Growth Plan to unlock unlimited workspace operator accounts.`
//         });
//         return;
//       }
//     }

//     if (activeSub.plan.plan_name === "BASIC_PLAN") {
//       // 💡 The Fix: Changed from 'id' to 'businessId' to read global company sales totals!
//       const currentSalesCount = await countTenantSales(businessId, activeSub.start_at)

//       if (currentSalesCount >= activeSub.plan.max_sales) {
//         return res.status(403).json({
//           status: "fail",
//           code: "USAGE_LIMIT_EXCEEDED",
//           message: `Access Denied: You have reached the maximum volume threshold limit of ${activeSub.plan.max_sales} sales receipts allocated to your Free Trial. Please select a plan to continue.`
//         });
//       }
//     }

//     // ✅ If all criteria clear successfully, pass execution smoothly downward to your controllers
//     return next();

//   } catch (error) {
//     // Forward unexpected exceptions safely to your globalErrorHandler middleware catcher
//     return next(error);
//   }
// };

import { Request, Response, NextFunction } from "express";
import { getActiveSubscription, countTenantSales, countStaffRegister } from "../models/midllewareMolde";
import { prisma } from "../config/db";

/**
 * Global Multi-Tenant Active Verification Gate.
 * Validates tenant workspace identity context and verifies calendar plan expiration thresholds.
 */
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
    if (role !== "OWNER") {
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