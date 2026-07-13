import { Request, Response, NextFunction } from "express";
import { otherQueue } from "../backgroundQueues/otherQueue.js";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import {redis} from "../config/redis"
import { generateReportService } from "../services/reportService.js";
import { getActiveSubscription } from "../models/midllewareMolde.js";
//  generate report controller
export const handleGetDynamicReportDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, role } = (req as any).user;
    
    // Read the custom timeline checkpoint sent by your client frontend interface
    const startDateQuery = req.query.startDate as string;

    // 1. Executive Security Clearance Filter: Block low-tier cashiers
    if (role !== "OWNER") {
      res.status(403).json({
        status: "fail",
        message: "Access Denied: Administrative owner profile privileges are required to generate business performance reports."
      });
      return; // Halts the function instantly without violating strict Promise<void> type constraints
    }

    if (!startDateQuery) {
      res.status(400).json({
        status: "fail",
        message: "Bad Request: A valid 'startDate' query parameter (ISO string format) must be supplied by the frontend."
      });
      return;
    }

    // 2. Trigger your dynamic service pass-through pipeline
    const compiledReport = await generateReportService(id, startDateQuery);

   res.status(200).json({
      status: "success",
      message: "Business report compiled successfully for the selected date range.",
      data: compiledReport
    });

  } catch (error) {
   return  next(error);
  }
};


//  download report as cvs file controller
export const handleDownloadReportCSV = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, role } = (req as any).user;
    const startDateQuery = req.query.startDate as string;

    // 1. 🛡️ Executive Security Gate: Reject low-tier cashiers
    if (role !== "OWNER") {
      res.status(403).json({
        status: "fail",
        message: "Access Denied: Administrative owner profile privileges are required to download financial spreadsheets."
      });
      return;
    }

    if (!startDateQuery) {
      res.status(400).json({
        status: "fail",
        message: "Bad Request: A valid 'startDate' query parameter (ISO string format) must be supplied by the frontend."
      });
      return;
    }
    const activeSub = await getActiveSubscription(id)
     if (activeSub?.plan?.plan_name === "BASIC_PLAN") {
      res.status(403).json({
        status: "fail",
        code: "PREMIUM_FEATURE_LOCKED",
        message: "Feature Locked: Spreadsheet downloads are not included in the Basic Plan. Please upgrade to the Pro Growth Plan to unlock data extraction tools."
      });
      return; // Halts the pipeline instantly before any BullMQ jobs or file scripts fire!
    }
    const uniqueJobTicketId = crypto.randomUUID();

    // 🚀 THE NON-BLOCKING WIN: Drop the heavy parameters payload straight into Redis background queue
    const reportgeneratingPayload ={
      businessId:id,
      startDateQuery:startDateQuery,
      jobId:uniqueJobTicketId
    }
    await otherQueue.add("compile-cvs-report-statement", reportgeneratingPayload);

    res.status(202).json({
      status: "processing",
      message: "Your executive spreadsheet summary task has been queued successfully.",
      jobId: uniqueJobTicketId,
      checkStatusUrl: `/api/v1/sales/report-status/${uniqueJobTicketId}`
    });

  } catch (error) {
    return next(error);
  }
};

//  report cvs download status checker
export const handleGetCvsReportStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { jobId } = req.params;
    
    // Query your fast Redis RAM cache layer for this job ticket
    const cacheData = await redis.get(`report:status:${jobId}`);

    // If the background worker hasn't finished writing the file yet, the key will be null
    if (!cacheData) {
      res.status(200).json({
        status: "processing",
        message: "Your executive financial statement is still compiling inside background worker threads."
      });
      return;
    }

    const parsedStatusReport = JSON.parse(cacheData);

    // If completed, return the download retrieval URL channel path directly to the frontend interface
    res.status(200).json({
      status: "success",
      message: "Your report has compiled successfully and is ready for download retrieval.",
      data: parsedStatusReport
    });

  } catch (error) {
    return next(error);
  }
};

/**
  RETRIEVAL CONTROLLER: Streams the plain CSV text directly down the socket line.
 */
export const handleRetrieveFinishedReportCSV = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { jobId } = req.params;
    const targetFilePath = path.resolve(`./storage/BizFlow_Report_${jobId}.csv`);

    if (!fs.existsSync(targetFilePath)) {
      res.status(404).json({ status: "fail", message: "The compiled spreadsheet file was not located on storage arrays." });
      return;
    }

    // Set isolated streaming text/csv attachment headers
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="BizFlow_Spreadsheet_${jobId}.csv"`);

    const fileStream = fs.createReadStream(targetFilePath);
    fileStream.pipe(res);
  } catch (error) {
   return next(error);
  }
};
//  download report as pdf
export const handleDownloadReportPDF = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, role } = (req as any).user;
    const startDateQuery = req.query.startDate as string;

    // 1. 🛡️ Executive Security Clearance Gate
    if (role !== "OWNER") {
      res.status(403).json({
        status: "fail",
        message: "Access Denied: Administrative owner profile privileges are required to download PDF financial reports."
      });
      return;
    }

    if (!startDateQuery) {
      res.status(400).json({
        status: "fail",
        message: "Bad Request: A valid 'startDate' query parameter must be supplied by the frontend."
      });
      return;
    }

    const activeSub = await getActiveSubscription(id)
     if (activeSub?.plan?.plan_name === "BASIC_PLAN") {
      res.status(403).json({
        status: "fail",
        code: "PREMIUM_FEATURE_LOCKED",
        message: "Feature Locked: Spreadsheet downloads are not included in the Basic Plan. Please upgrade to the Pro Growth Plan to unlock data extraction tools."
      });
      return; // Halts the pipeline instantly before any BullMQ jobs or file scripts fire!
    }
     const uniqueJobTicketId = crypto.randomUUID();

    // 🚀 THE NON-BLOCKING WIN: Drop the heavy parameters payload straight into Redis background queue
    const reportgeneratingPayload ={
      businessId:id,
      startDateQuery:startDateQuery,
      jobId:uniqueJobTicketId
    }
    await otherQueue.add("compile-pdf-report-statement", reportgeneratingPayload);

    // Respond back to the frontend dashboard instantly so user interface loaders can fire up smoothly
    res.status(202).json({
      status: "processing",
      message: "Your executive financial statement compilation task has been queued successfully.",
      jobId: uniqueJobTicketId,
      checkStatusUrl: `/api/sales/report-download-status/${uniqueJobTicketId}`
    });
    
  } catch (error) {
   return next(error);
  }
};

//  check report pdf download status
export const handleGetReportStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { jobId } = req.params;
    
    // Query your fast Redis RAM cache layer for this job ticket
    const cacheData = await redis.get(`pdf:report:status:${jobId}`);

    // If the background worker hasn't finished writing the file yet, the key will be null
    if (!cacheData) {
      res.status(200).json({
        status: "processing",
        message: "Your executive financial statement is still compiling inside background worker threads."
      });
      return;
    }

    const parsedStatusReport = JSON.parse(cacheData);

    // If completed, return the download retrieval URL channel path directly to the frontend interface
    res.status(200).json({
      status: "success",
      message: "Your report has compiled successfully and is ready for download retrieval.",
      data: parsedStatusReport
    });

  } catch (error) {
    return next(error);
  }
};

/**
 * 💾 2. RETRIEVAL CONTROLLER: Sets proper download headers and streams the physical PDF file.
 */
export const handleRetrieveFinishedReportPDF = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { jobId } = req.params;
    const targetFilePath = path.resolve(`./storage/BizFlow_Report_${jobId}.pdf`);

    if (!fs.existsSync(targetFilePath)) {
      res.status(404).json({
        status: "fail",
        message: "The compiled file was not located on the disk storage array."
      });
      return;
    }

    // 🖨️ Set professional networking attachment streaming headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="BizFlow_Statement_${jobId}.pdf"`);

    // Stream the binary bits directly from your server hard drive to the client browser
    const fileStream = fs.createReadStream(targetFilePath);
    fileStream.pipe(res);

  } catch (error) {
    return next(error);
  }
};