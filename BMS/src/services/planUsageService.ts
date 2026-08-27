import { countTenantSales, getActiveSubscription } from "../models/midllewareMolde";
//  get usauge sales data
export const getTotalSalesCount = async(businessId:string) =>{
    console.log(businessId)
    const activePlan= await  getActiveSubscription(businessId)
    console.log(activePlan)
    if(!activePlan){
        return;
    }
    const plan_startAt = activePlan.start_at
    const currentSalesCount = await countTenantSales(businessId, plan_startAt)
    return {
        currentSalesCount,
        planName:activePlan.plan.plan_name,
        planExpired:activePlan.expired_at
    }
}