import crypto from "crypto"
import { prisma } from "../config/db";
export const updateSubscription = async (data: any) =>{
   return await prisma.$transaction(async(tx) =>{
        const updateSubscriptionData = await tx.subscription.upsert({
                where: {
                    id: data.businessId 
                },
                update: {
                    start_at:   data.start_at,
                    status:     data.status || "active", // Syncing lowercase "active" matching your comment rules
                    expired_at: data.expired_at,
                },
                create: {
                    id:          data.businessId,
                    business_id: data.businessId,
                    // Fallback placeholder ID link string variable block if creating from raw scratch template profiles
                    plan_id:     crypto.randomUUID(), 
                    status:      data.status || "active",
                    start_at:    data.start_at,
                    expired_at:  data.expired_at,
                }
                });

                await tx.plan.update({
                        where: {
                            id: updateSubscriptionData.plan_id // Links straight to this store's private active plan details!
                        },
                        data: {
                            plan_name:  data.plan_name,
                            plan_price: data.plan_price,
                            max_staff:  data.max_staff,
                            max_sales:  data.max_sales,
                            trial_days: data.trial_days
                        }
                    });

                    await tx.payment.create({
                        data: {
                            business_id:     data.businessId,
                            subscription_id: updateSubscriptionData.id, // Links to our freshly upserted subscription block record ID
                            amount:          data.amount,
                            payment_status:  "success", // 🆙 As requested: Ingesting payment status
                            reference:       data.reference, // 🆙 As requested: Logging Paystack unique gateway reference tracking ID
                            paid_at:         data.currentDate
                        }
                });
                return updateSubscription
    })
}

//  get all payment made by business owner
export const getPaymentModel = async (businessId :string) =>{
    const payment = await prisma.payment.findMany({
        where:{
            business_id:businessId
        },
        select:{
            id:true,
            reference:true,
            amount:true,
            payment_status:true,
            paid_at:true
        }
    })
    return payment
}