import PDFDocument from "pdfkit";
import { redis } from "../config/redis";
import { generateReportService } from "../services/reportService"
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
export const reportJob = async (data:any) =>{
    let business_id = ""
    let startDate =""
    if(data){
        business_id = data.business_id
        startDate = data.startDate
    }
    const report = await generateReportService(business_id, startDate)

      const storageDirectory = path.resolve("./storage");

  // If the physical directory doesn't exist on your Windows hard drive, create it automatically!
    if (!fs.existsSync(storageDirectory)) {
        fs.mkdirSync(storageDirectory, { recursive: true });
        console.log(`📁 [BizFlow Storage]: Created missing parent folder array directory at ${storageDirectory}`);
    }

  // 2. Define your clean dynamic filename handle path safely
        const outputFilePath = path.join(storageDirectory, `BizFlow_Report_${data.jobId}.pdf`);
        const writeStream = fs.createWriteStream(outputFilePath);
        // 4. 🖨️ INITIALIZE PDFKIT DOCUMENT INSTANCE IN SERVER RAM
        const doc = new PDFDocument({ margin: 54, size: "A4" });
        //  const outputFilePath = `./storage/BizFlow_Report_${data.jobId}.pdf`;
        // const writeStream = fs.createWriteStream(outputFilePath);
        doc.pipe(writeStream);
        // Global Typography Set: Strict Times-Roman for financial compliance
        const FONT_REG = "Times-Roman";
        const FONT_BOLD = "Times-Bold";
    
        // =========================================================
        // 📄 SECTION 1: MASTER LETTERHEAD
        // =========================================================
        doc.fillColor("#000000").font(FONT_BOLD).fontSize(20).text("BIZFLOW MANAGEMENT SYSTEM", {align:"center"});
        doc.font(FONT_REG).fontSize(10).fillColor("#555555").text("EXECUTIVE PERFORMANCE & FINANCIAL STATEMENT", {align:"center"});
        
        // Minimalist Top Double Rule Separator
       doc.moveTo(54, 98).lineTo(541, 98).strokeColor("#000000").lineWidth(1).stroke();
        doc.moveTo(54, 101).lineTo(541, 101).strokeColor("#000000").lineWidth(0.5).stroke();
        doc.moveDown(2);
    
        // Statement Metadata Block
        let yPos = 105;
        doc.font(FONT_BOLD).fontSize(10).fillColor("#000000").text("Statement Date:", 54, yPos);
        doc.font(FONT_REG).text(report.generated_at.toUTCString(), 140, yPos);
        
        yPos += 14;
        doc.font(FONT_BOLD).text("Audit Timeline:", 54, yPos);
        doc.font(FONT_REG).text(`From: ${startDate} To: ${new Date().toISOString().split('T')[0]}`, 140, yPos);
        
        yPos += 14;
        doc.font(FONT_BOLD).text("Company Name:", 54, yPos);
        doc.font(FONT_REG).text(`${report.business_context.company_name?.toUpperCase()}`, 140, yPos);
    
        yPos += 14;
        doc.font(FONT_BOLD).text("Owner Name:", 54, yPos);
        doc.font(FONT_REG).text(`${report.business_context.owner_name?.toUpperCase()}`, 140, yPos);
    
        // =========================================================
        // 📊 SECTION 2: METRICS TABLES ARCHITECTURE
        // =========================================================
        
        // --- TABLE 1: SUMMARY PERFORMANCE METRICS ---
        yPos += 30;
        doc.font(FONT_BOLD).fontSize(12).text("TRAFFIC & GENERAL VOLUME SUMMARY", 54, yPos);
        
        yPos += 18;
        // Table 1 Headers
        doc.fontSize(9).font(FONT_BOLD);
        doc.text("METRIC DESCRIPTION", 54, yPos);
        doc.text("ACCOUNTING REALITY", 400, yPos, { width: 141, align: "right" });
        
        yPos += 12;
        doc.moveTo(54, yPos).lineTo(541, yPos).strokeColor("#777777").lineWidth(0.5).stroke();
        
        // Table 1 Rows
        const metricsRows = [
          ["Total Invoices / Receipts Issued", `${report.traffic_and_volume.total_receipts_issued}`],
          ["Average Ticket Size / Basket Value", `NGN ${report.traffic_and_volume.average_basket_value.toFixed(2)}`],
          ["Gross Sales Turn-over Volume", `NGN ${report.traffic_and_volume.gross_sales_volume.toFixed(2)}`]
        ];
    
        metricsRows.forEach((row) => {
          yPos += 16;
          doc.font(FONT_REG).fontSize(10).text(row[0], 54, yPos);
          doc.text(row[1], 400, yPos, { width: 141, align: "right" });
        });
    
        // --- TABLE 2: REVENUE TRACKING BY DISBURSEMENT CHANNEL ---
        yPos += 35;
        doc.font(FONT_BOLD).fontSize(12).text("DIGITAL SETTLEMENT REVENUE TRACKING", 54, yPos);
        
        yPos += 18;
        // Table 2 Headers
        doc.fontSize(9).font(FONT_BOLD);
        doc.text("PAYMENT METHOD CHANNEL", 54, yPos);
        doc.text("SETTLED INCOME (NGN)", 400, yPos, { width: 141, align: "right" });
        
        yPos += 12;
        doc.moveTo(54, yPos).lineTo(541, yPos).strokeColor("#777777").lineWidth(0.5).stroke();
    
        const paymentRows = [
          ["Cash Receipts Payouts", `NGN ${report.gross_revenue_tracking.cash_payouts.toFixed(2)}`],
          ["POS Machine Terminal Payouts", `NGN ${report.gross_revenue_tracking.card_payouts.toFixed(2)}`],
          ["Direct Mobile App Bank Transfers", `NGN ${report.gross_revenue_tracking.transfer_payouts.toFixed(2)}`]
        ];
    
        paymentRows.forEach((row) => {
          yPos += 16;
          doc.font(FONT_REG).fontSize(10).text(row[0], 54, yPos);
          doc.text(row[1], 400, yPos, { width: 141, align: "right" });
        });
    
        // --- TABLE 3: HIGH-VELOCITY PRODUCT MERCHANDISE ---
        yPos += 35;
        doc.font(FONT_BOLD).fontSize(12).text("PRODUCT SALES PERFORMANCE VELOCITY LOGS (TOP 5)", 54, yPos);
        
        yPos += 18;
        // Table 3 Headers
        doc.fontSize(9).font(FONT_BOLD);
        doc.text("PRODUCT NAME DESCRIPTION", 54, yPos);
        doc.text("UNITS SOLD", 340, yPos, { width: 80, align: "right" });
        doc.text("REVENUE CONTRIBUTION", 430, yPos, { width: 131, align: "right" });
        
        yPos += 12;
        doc.moveTo(54, yPos).lineTo(541, yPos).strokeColor("#777777").lineWidth(0.5).stroke();
    
        // Table 3 Data Evaluation
        if (report.product_performance.highest_moving_items.length === 0) {
          yPos += 16;
          doc.font(FONT_REG).fontSize(10).text("No inventory transactions captured within this selected range parameters.", 54, yPos);
        } else {
          report.product_performance.highest_moving_items.forEach((item: any) => {
            yPos += 16;
            doc.font(FONT_REG).fontSize(10).text(item.productName, 54, yPos, { width: 270, lineBreak: false });
            doc.text(`${item.unitsSold}`, 340, yPos, { width: 75, align: "right" });
            doc.text(`NGN ${item.revenueGenerated.toFixed(2)}`, 430, yPos, { width: 111, align: "right" });
          });
        }
    
        // Double Baseline Total Boundary Rule
        yPos += 20;
        doc.moveTo(54, yPos).lineTo(541, yPos).strokeColor("#000000").lineWidth(1).stroke();
        doc.moveTo(54, yPos + 2).lineTo(541, yPos + 2).strokeColor("#000000").lineWidth(0.5).stroke();
    
        // =========================================================
        // 🖨️ SECTION 3: COMPLIANCE FOOTER
        // =========================================================
        doc.font(FONT_REG).fontSize(8).fillColor("#777777");
        doc.text("CONFIDENTIAL STATISTICAL STATEMENT - PROCESSED AUTOMATICALLY VIA BIZFLOW MULTI-TENANT ENGINE.", 54, 755, { align: "center" });
    
        // Seal the data stream pipeline
        doc.end();
        return new Promise<void>((resolve, reject) => {
        writeStream.on("finish", async () => {
    
    // 💡 THE STATUS SYNC FIX: Cache the compilation success flag right into Redis!
    const cacheDataPayload = {
      status: "COMPLETED",
      fileUrl: `/api/sales/download-report/${data.jobId}.pdf` // Direct path to fetch the binary bits later
    };
    
    // Store in Redis RAM with a 24-hour expiration safety TTL window
    await redis.set(`pdf:report:status:${data.jobId}`, JSON.stringify(cacheDataPayload), "EX", 24 * 60 * 60);
    console.log(`✅ [BizFlow Workers]: Job [${data.jobId}] completely written to disk and cached in Redis RAM.`);
    resolve();
  });

  writeStream.on("error", (err) => reject(err));
});

}

//  cvs report file background job
export const cvsReportJob = async (data: any) => {
  let business_id = "";
  let startDate = "";
  let jobId = "";

  if (data) {
    business_id = data.business_id;
    startDate = data.startDate;
    jobId = data.jobId; // Capture the unique tracking ticket ID
  }

  // 1. 📁 SELF-HEALING DIRECTORY GUARD
  const storageDirectory = path.resolve("./storage");
  if (!fs.existsSync(storageDirectory)) {
    fs.mkdirSync(storageDirectory, { recursive: true });
    console.log(`📁 [BizFlow Storage]: Created missing parent folder array directory at ${storageDirectory}`);
  }

  // Fetch the live dynamic 3-Pillar report snapshot layout payload
  const report = await generateReportService(business_id, startDate);

  // 2. 📊 BUILD THE PROFESSIONAL CSV TEXT BLOCK STRING
  let csvContent = "";

  // Header Meta Section
  csvContent += `BIZFLOW BUSINESS PERFORMANCE SUMMARY REPORT\n`;
  csvContent += `Generated At,${report.generated_at.toISOString()}\n`;
  csvContent += `Timeline Window,From ${startDate} to ${new Date().toISOString().split('T')[0]}\n\n`;

  // Pillar 1: Traffic & Volume CSV Block
  csvContent += `1. TRAFFIC & VOLUME METRICS\n`;
  csvContent += `Metric Vector,Calculated Realities\n`;
  csvContent += `Total Receipts Issued,${report.traffic_and_volume.total_receipts_issued}\n`;
  csvContent += `Average Basket Value Size,${report.traffic_and_volume.average_basket_value.toFixed(2)}\n`;
  csvContent += `Gross Sales Volume Revenue,${report.traffic_and_volume.gross_sales_volume.toFixed(2)}\n\n`;

  // Pillar 2: Gross Revenue Tracking Payouts
  csvContent += `2. DIGITAL SETTLEMENT REVENUE TRACKING\n`;
  csvContent += `Payment Method Channel,Settled Income\n`;
  csvContent += `Cash Receipts Payouts,${report.gross_revenue_tracking.cash_payouts.toFixed(2)}\n`;
  csvContent += `POS Machine Terminal Payouts,${report.gross_revenue_tracking.card_payouts.toFixed(2)}\n`;
  csvContent += `Direct Mobile App Bank Transfers,${report.gross_revenue_tracking.transfer_payouts.toFixed(2)}\n\n`;

  // Pillar 3: Product Performance Velocity Grid List
  csvContent += `3. PRODUCT SALES PERFORMANCE VELOCITY LOGS (TOP 5)\n`;
  csvContent += `Product Catalog Name,Units Depleted from Stock,Gross Revenue Contribution\n`;
  
  if (report.product_performance.highest_moving_items.length === 0) {
    csvContent += `No stock transactions logged within this date range.,0,0.00\n`;
  } else {
    report.product_performance.highest_moving_items.forEach((item: any) => {
      // Sanitize commas out of text descriptions to protect CSV cell borders
      const safeName = item.productName.replace(/,/g, " ");
      csvContent += `${safeName},${item.unitsSold},${item.revenueGenerated.toFixed(2)}\n`;
    });
  }

  // 3. 📝 WRITE COMPLETE DATA TO STORAGE DISK
  const outputFilePath = path.join(storageDirectory, `BizFlow_Report_${jobId}.csv`);
  await fs.promises.writeFile(outputFilePath, csvContent, "utf8");

  // 4. ⚡ CACHE SUCCESS MARKERS IN REDIS RAM FOR THE POLLING CONTROLLER
  const cacheDataPayload = {
    status: "COMPLETED",
    fileUrl: `/api/sales/download-report/${jobId}.cvs` // Pass file types cleanly down parameters
  };
  
  await redis.set(`cvs:report:status:${jobId}`, JSON.stringify(cacheDataPayload), "EX", 24 * 60 * 60);
  console.log(`✅ [BizFlow Workers]: CSV Spreadsheet [${jobId}] completely written to disk and cached in Redis.`);
};