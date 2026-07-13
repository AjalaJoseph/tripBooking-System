import { Router } from "express"
import { handleBulkProductsUpload, handleGetProductsController, handleEditSingleProduct, handleDeleteSingleProduct } from "../controllers/productsController"
import { enforceSubscriptionGate } from "../middleware/subscription"
import { validateBulkProductInput, validateEditProductInput} from "../validators/productValidator"
import { verifyAccessToken } from "../middleware/verifyAccessToken"
 export const productRouter = Router()
productRouter.post('/upload-products', verifyAccessToken, enforceSubscriptionGate,validateBulkProductInput,handleBulkProductsUpload)
productRouter.get('/products', verifyAccessToken,enforceSubscriptionGate,handleGetProductsController)
productRouter.patch("/products/:productId/edit", verifyAccessToken, enforceSubscriptionGate, validateEditProductInput, handleEditSingleProduct);
productRouter.delete("/products/:productId/delete", verifyAccessToken, enforceSubscriptionGate,handleDeleteSingleProduct)