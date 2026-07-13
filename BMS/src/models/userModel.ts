import { prisma } from "../config/db";
export const registerBusinessOwner = async (data:any) =>{
    return await prisma.$transaction( async(tx) =>{
        const createBusinnesAccount = await tx.business.create({
            data: {
                business_name: data.business_name,
                owner_name: data.owner_name,
                business_email: data.business_email,
                password: data.passwordHash, // Hashed in the service layer
              },
        })
        
            const freePlanTemplate = await tx.plan.create({
                data: {
                    plan_name: "FREE_TRIAL",
                    plan_price: 0.00,
                    max_staff: 2,     
                    max_sales: 300,   
                    trial_days: 30,   
                },
      });
   

    // Calculate 30 days expiration date parameters
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + freePlanTemplate.trial_days);

    // Link the business to the active 30-day Free Trial subscription logs
    const subscription = await tx.subscription.create({
            data: {
                business_id: createBusinnesAccount.id,
                plan_id: freePlanTemplate.id,
                status: "active",
                start_at: new Date(),
                expired_at: expiryDate,
            },
    });

    return { business: createBusinnesAccount, subscription, freePlanTemplate };
  });
}

export const getBusinessAccount = async (email:string) =>{
    const findBusiness = await prisma.business.findUnique({
        where:{
            business_email:email
        }
    })
    return findBusiness
}

//  register staff 
export const registerStaff = async (data:any) =>{
    const registerStaffByBusinessOwner = await prisma.user.create({
        data:{
            businessId:data.business_id,
            staff_name:data.staff_name,
            staff_email:data.staff_email,
            password:data.password,
            role:"STAFF"
        }
    })
    return registerStaffByBusinessOwner
}

//  getStaff data and check if staff exist
export const getStaffData = async (email:string) => {
  const staff = await prisma.user.findUnique({
    where: {
      staff_email: email, // Look up by unique email column handle match rules
      isActive:true
    }
  });
  
  return staff;
};

// update staff password
export const updateStaffPassword =async (email:string, password:string)=>{
    return await prisma.user.update({
        where:{
            staff_email:email,
            isActive:true,
        },
        data:{
            password:password,
            isPasswordChanged:true
        }
    })
}

//  get all register staff by business owner
export const getAllStaff = async (businessId: string) => {
  const allstaff = await prisma.user.findMany({
    where: {
      businessId: businessId,
    },
    // 💡 The Security Fix: Select exactly which columns are safe to transmit over the wire
    select: {
      id: true,
      businessId: true,
      staff_name:true,
      staff_email:true,
      role: true,
      isPasswordChanged: true,
      isActive: true,
      createdAt: true,
      // 🔒 passwordHash is omitted here, so it is mathematically impossible to expose it!
    },
    orderBy: {
      createdAt: 'desc', // Lists newest employees at the top of the owner's dashboard table
    },
  });
  return  allstaff
};

// edit staff data
export const editStaffProfile = async (data:any) =>{
    const edit = await prisma.user.update({
        where:{
            id:data.id,
        },
        data:{
            staff_name:data.name,
            staff_email:data.email,
            role:data.role || 'STAFF',
            isActive: data.status !== undefined ? data.status : true
        },
        select: {
                id: true,
                businessId: true,
                staff_name:true,
                staff_email:true,
                role: true,
                isPasswordChange: true,
                isActive: true,
                createdAt: true,
                updatedAt:true
      // 🔒 passwordHash is omitted here, so it is mathematically impossible to expose it!
    },
    })
    return edit
}
//  find staff if exist 
export const checkStaff = async (id:string, businessId:string) =>{
    return await prisma.user.findFirst({
        where:{
            id:id,
            businessId:businessId
        },
        include:{business:true}
    })
}

//  check user by id 
export const staffData = async (id:string) =>{
    return await prisma.user.findUnique({
        where:{
            id:id
        },
        include:{business:true}
    })
}

//  delete staff register by business owner
export const deleteStaff = async (staff_id:string) =>{
    return await prisma.user.delete({
        where:{
            id:staff_id
        }
    })
}

//  forgot password for business owner
export const businessOwnerResetPassword = async (email:string, password:string) =>{
    const reset = await prisma.business.update({
        where:{
          business_email:email
        },
        data:{
            password:password
        },
        select:{
            id:true,
            business_email:true,
            owner_name:true,
            business_name:true
        }
    })
    return reset
}

//  forgot password for all staff register 
export const staffResetPassword = async (email:string, password:string) =>{
    const reset = await prisma.user.update({
        where:{
            staff_email:email
        },
        data:{
            password:password
        },
        select:{
            id:true,
            staff_email:true,
            staff_name:true,
        }
    })
    return reset
}