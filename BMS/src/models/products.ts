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
export const getAllProducts = async (businessId: string, page: number = 1, limit: number = 10, searchQuery: string) => {
  const skip = (page - 1) * limit;
  
  const whereConditions: any = {
    businessId: businessId, // Multi-tenant safety isolation boundary
  };

  // 1. 🔥 THE FIX: Apply the search filter query conditions FIRST before any counts are computed
  if (searchQuery && searchQuery.trim() !== "") {
    whereConditions.product_name = {
      contains: searchQuery.trim(),
      mode: 'insensitive', // Matches casing anomalies seamlessly
    };
  }

  // 2. 🔥 ACCURACY FIX: Run both operations concurrently to get correct search metrics
  const [allProducts, totalProducts] = await prisma.$transaction([
    prisma.product.findMany({
      where: whereConditions,
      select: {
        id: true,
        product_name:true,
        stockCount:true,
        sellingPrice:true
      },
      skip: skip,
      take: limit,
      orderBy: { createdAt: "desc" }
    }),
    prisma.product.count({
      where: whereConditions // Counts ONLY the items matching your active search string filters!
    })
  ]);

  const totalPages = Math.ceil(totalProducts / limit);

  return {
   allProducts,
    pagination: {
      totalProducts: totalProducts,
      totalPages: totalPages,
      currentPage: page,
      limit: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

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