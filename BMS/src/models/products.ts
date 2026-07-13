import { prisma } from "../config/db";
export const insertBulkProductsModel = async (businessId: string, productsList: any[]) => {
  // Execute everything within an isolated transaction block
  return await prisma.$transaction(async (tx) => {
    const creationPromises = productsList.map(product => 
      tx.product.create({
        data: {
          businessId:   businessId,
          product_name: product.product_name,             // 💡 Matches column name: product_name
          sellingPrice: product.sellingPrice,     // Automatically handles Prisma Decimal casting properties
          stockCount:   parseInt(product.quantity) // 💡 Matches column name: stockCount
        }
      })
    );
    return await Promise.all(creationPromises);
  });
};

//  get all product model
export const getAllProducts = async (businessId:string, page:number=1, limit:number=20) =>{
  const skip = (page - 1)*limit
  const totalProducts = await prisma.product.count({
    where:{
      businessId:businessId
    }
  })
  const totalPages = Math.ceil(totalProducts/limit)
  const allProducts = await prisma.product.findMany({
    where:{
      businessId:businessId
    },
    select:{
      id:true,
      product_name:true,
      sellingPrice:true,
      stockCount:true,

    },
    skip: skip,
    take:limit,
    orderBy:{createdAt:"desc"}
  })
  return {
    allProducts,
    pagination: {
            totalProducts: totalProducts,
            totalPages: totalPages,
            currentPage: page,
            limit: limit,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        }
  }
}

//  check if product exist
export const checkProduct = async (businessId:string, productId:string)=>{
  return await prisma.product.findFirst({
    where:{
      id:productId,
      businessId:businessId
    }
  })
}

export const updateSingleProductModel = async (productId: string, updateData: any) => {
   const update = await prisma.product.update({
    where: {
      id: productId
    },
    data: {
      product_name: updateData.product_name, 
      sellingPrice: updateData.sellingPrice, 
      stockCount:   updateData.stockCount 
    }
  });
  return update
};

//  delete single product
export const deleteSingleProductModel = async(productId:any)=>{
  return await prisma.product.delete({
    where:{
      id:productId
    },
     select: {
      id: true,
      businessId: true,
      product_name: true,
      sellingPrice: true,
      stockCount: true,
      createdAt: true
    }
  })
}