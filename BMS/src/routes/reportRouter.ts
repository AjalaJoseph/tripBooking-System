import { Router } from "express"
import { verifyAccessToken } from "../middleware/verifyAccessToken"
import { enforceSubscriptionGate } from "../middleware/subscription"
import { handleDownloadReportCSV,
    handleDownloadReportPDF,
    handleGetCvsReportStatus,
    handleGetDynamicReportDashboard,
    handleGetReportStatus,
    handleRetrieveFinishedReportCSV,
    handleRetrieveFinishedReportPDF
 } from "../controllers/reportContoller"
export const reportRouter = Router()
reportRouter.get("/generate-report", verifyAccessToken, enforceSubscriptionGate, handleGetDynamicReportDashboard)
reportRouter.get("/download-report/cvs", verifyAccessToken, enforceSubscriptionGate, handleDownloadReportCSV)
reportRouter.get("/download-report/pdf", verifyAccessToken, enforceSubscriptionGate, handleDownloadReportPDF)
reportRouter.get("/report-download-status/:jobId/pdf",verifyAccessToken, handleGetReportStatus )
reportRouter.get("/report-download-status/:jobId/cvs",verifyAccessToken, handleGetCvsReportStatus )
reportRouter.get("/download-report/:jobId/pdf", verifyAccessToken,handleRetrieveFinishedReportPDF)
reportRouter.get("/download-report/:jobId/cvs", verifyAccessToken,handleRetrieveFinishedReportCSV)