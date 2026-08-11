
import { insertBulkProductsModel,
  getAllProducts,
  checkProduct,
  updateSingleProductModel,
  deleteSingleProductModel,
  getProductForCashierSalesModel
 } from "../models/products";
 import { staffData } from "../models/userModel";
export const createBulkProductsService = async (businessId: string, productsArray: any[]) => {
  const batchOperationSummary = await insertBulkProductsModel(businessId, productsArray);
  return batchOperationSummary; 
};

//  get all products service
export const getAllProductsService = async (businessId:string,page:number, limit:number, searchQuery:string) =>{
  const getProducts =await getAllProducts(businessId,page, limit, searchQuery)
  return getProducts
}

//  update single product service
export const editProductService = async(businessId:string, productId:any, updatedData:any)=>{
  const product = await checkProduct(businessId,productId)
  if(!product){
    throw Object.assign(new Error("Unauthorized: you can only edit products upload by your business"),{STATUS_CODES:403})

  }
  const updatePayload = {
    product_name: updatedData.product_name !== undefined ? updatedData.product_name : product.product_name,
    sellingPrice: updatedData.sellingPrice !== undefined ? updatedData.sellingPrice : product.sellingPrice,
    // Safely parse the quantity input to ensure it remains a valid integer type inside PostgreSQL
    stockCount:   updatedData.quantity !== undefined ? parseInt(updatedData.quantity) : product.stockCount
  };

  const editProduct = await updateSingleProductModel(productId, updatePayload)
  return editProduct
}

//  delete single product
export const deleteSingleProductService = async (businessId:string, productId:any)=>{
   const product = await checkProduct(businessId,productId)
  if(!product){
    throw Object.assign(new Error("Unauthorized: you can only delete products upload by your business"),{STATUS_CODES:403})
  }
  return deleteSingleProductModel(productId)
}

//  get product for cashier search

export const getProductForCashierSalesService = async (staff_id:string, searchQuery:string) =>{
  const getBusinessId = await staffData(staff_id)
  const businesId = getBusinessId?.businessId
  return await getProductForCashierSalesModel(businesId, searchQuery)
}