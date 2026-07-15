import { Router } from "express"
import { handleBulkProductsUpload, handleGetProductsController, handleEditSingleProduct, handleDeleteSingleProduct } from "../controllers/productsController"
import { validateBulkProductInput, validateEditProductInput} from "../validators/productValidator"
import { verifyAccessToken } from "../middleware/verifyAccessToken"
 export const productRouter = Router()
productRouter.post('/upload-products', verifyAccessToken,validateBulkProductInput,handleBulkProductsUpload)
productRouter.get('/products', verifyAccessToken,handleGetProductsController)
productRouter.patch("/products/:productId/edit", verifyAccessToken, validateEditProductInput, handleEditSingleProduct);
productRouter.delete("/products/:productId/delete", verifyAccessToken,handleDeleteSingleProduct)