import { prisma } from "../config/db.js";

/**
 * Fetches the currently active subscription record along with its plan details.
 */
export const getActiveSubscription = async (businessId: string) => {
  const sub = await prisma.subscription.findUnique({
    where: {
      business_id:businessId
    },
    include: {
      plan: true // Join the parent Plan table to read max_staff and max_sales caps
    }
  });
  return  sub
};

/**
 * Counts total processed transaction sales receipts for a tenant workspace.
 */
export const countTenantSales = async (businessId: string, billingCycleStart: Date): Promise<number> => {
  return await prisma.sale.count({
    where: { 
      businessId: businessId,
      createdAt: {
        gte: billingCycleStart // 🚀 THE FIX: Only counts sales made during the current paid month!
      }
    }
  });
};

// count total staff register
export const countStaffRegister = async (businessId:string) =>{
  return await prisma.user.count({
    where:{
      businessId:businessId
    },
  })
} 