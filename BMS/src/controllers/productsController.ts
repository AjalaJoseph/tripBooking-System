import { Request, Response, NextFunction } from "express";
import { createBulkProductsService,
    getAllProductsService,
    editProductService,
    deleteSingleProductService,
    getProductForCashierSalesService
 } from "../services/productService";
 import { logger } from "../config/logger";
export const handleBulkProductsUpload = async (req:Request, res:Response, next:NextFunction) =>{
    try{
        const {id} = (req as any).user
        const { products } = req.body
          const createdProducts = await createBulkProductsService(id, products);
           res.status(201).json({
                status: "success",
                message: `Inventory batch upload processed successfully. Added ${createdProducts.length} new items to your stock dashboard records.`,
                results:createdProducts.length,
                data: createdProducts
    });


    }catch(error){
        return next(error)
    }
}

// get all product upload controller
export const handleGetProductsController = async (req:Request, res:Response, next:NextFunction) =>{
    try{
        const {id} = (req as any ).user
        const pageStr = req.query.page as string;
        const page = Math.max(1, parseInt(pageStr) || 1);
        const limitStr = req.query.limit as string;
        const limit = Math.max(1, parseInt(limitStr) || 10);
         const search = (req.query.search as string) || "";
        const getProducts = await getAllProductsService(id, page, limit,search)
         res.status(200).json({
            status: "success",
            results: getProducts.allProducts.length,
            data:getProducts.allProducts,
            pagination:getProducts.pagination
    });
    }catch(error){
        return next(error)
    }
}
//  edit single product
export const handleEditSingleProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract the businessId safely from the verified token payload session
    const { id } = (req as any).user;
    const { productId } = req.params;
    const { product_name, sellingPrice, quantity} = req.body
    const updateData ={
        product_name:product_name,
        sellingPrice:sellingPrice,
        quantity:quantity
    }
    const updatedRowResult = await editProductService(id, productId, updateData);

    res.status(200).json({
      status: "success",
      message: "Inventory row modified successfully.",
      data: updatedRowResult
    });
  }catch(error){
    return next(error)
  }
}
//  delete single product controller
export const handleDeleteSingleProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = (req as any).user;
  
    const { productId } = req.params;
    const deletedProductSummary = await deleteSingleProductService(id, productId);

    res.status(200).json({
      status: "success",
      message: "Inventory item permanently removed from your store dashboard directory.",
      data: deletedProductSummary
    });

  } catch (error) {
    return next(error);
  }
};

//  get product for cashier controller
export const handleGetProductForCashierController = async (req:Request, res:Response, next:NextFunction) =>{
  try{
    const {id } = (req as any).user
     const search = (req.query.search as string) || "";
    const productsList = await getProductForCashierSalesService(id, search)
     return res.status(200).json({
      status: "success",
      message: "Inventory records compiled successfully for terminal cashier usage.",
      data: productsList
    });
  }catch(error){
    return next(error)
  }
}

//  product excel file upload template controller 
export const handleDownloadProductTemplateCSV = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info("📡 Ingesting CSV template retrieval request packet...");

    const csvHeaders = ["product_name", "sellingPrice", "quantity"].join(",");
    
    const sampleRow = ["Sample Product A", "1500.00", "50"].join(",");
    
    const csvContent = `${csvHeaders}\n${sampleRow}`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=baazio_product_upload_template.csv"
    );
    res.setHeader("Cache-Control", "no-cache");

    // Send the generated buffer data cleanly back down the active network lane
    res.status(200).send(csvContent);
    return;

  } catch (error) {
    logger.error("💥 Failed to compile infrastructure CSV spreadsheet document stream:", error);
    next(error); 
  }
};