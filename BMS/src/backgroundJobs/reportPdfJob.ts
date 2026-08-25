import PDFDocument from "pdfkit";
import { redis } from "../config/redis";
import { generateReportService } from "../services/reportService";
import fs from "fs";
import path from "path";

interface ReportJobData {
  business_id: string;
  startDate: string;
  endDate: string;
  jobId: string;
}

/**
 * ============================================================
 * PDF REPORT BACKGROUND JOB
 * ============================================================
 */
export const reportJob = async (data: ReportJobData): Promise<void> => {
  const {
    business_id,
    startDate,
    endDate,
    jobId,
  } = data;

  // ============================================================
  // 1. GENERATE REPORT DATA
  // ============================================================

  const report = await generateReportService(
    business_id,
    startDate,
    endDate
  );

  // ============================================================
  // 2. ENSURE STORAGE DIRECTORY EXISTS
  // ============================================================

  const storageDirectory = path.resolve("./storage");

  if (!fs.existsSync(storageDirectory)) {
    fs.mkdirSync(storageDirectory, {
      recursive: true,
    });

    console.log(
      `📁 [Baazio Storage]: Created storage directory at ${storageDirectory}`
    );
  }

  // ============================================================
  // 3. CREATE PDF FILE PATH
  // ============================================================

  const outputFilePath = path.join(
    storageDirectory,
    `Baazio_Report_${jobId}.pdf`
  );

  const writeStream = fs.createWriteStream(outputFilePath);

  // ============================================================
  // 4. INITIALIZE PDF DOCUMENT
  // ============================================================

  const doc = new PDFDocument({
    margin: 54,
    size: "A4",
  });

  doc.pipe(writeStream);

  const FONT_REG = "Times-Roman";
  const FONT_BOLD = "Times-Bold";

  // ============================================================
  // SECTION 1: LETTERHEAD
  // ============================================================

  doc
    .fillColor("#000000")
    .font(FONT_BOLD)
    .fontSize(20)
    .text("BAAZIO MANAGEMENT SYSTEM", {
      align: "center",
    });

  doc
    .font(FONT_REG)
    .fontSize(10)
    .fillColor("#555555")
    .text("EXECUTIVE PERFORMANCE & FINANCIAL STATEMENT", {
      align: "center",
    });

  // Double separator
  doc
    .moveTo(54, 98)
    .lineTo(541, 98)
    .strokeColor("#000000")
    .lineWidth(1)
    .stroke();

  doc
    .moveTo(54, 101)
    .lineTo(541, 101)
    .strokeColor("#000000")
    .lineWidth(0.5)
    .stroke();

  // ============================================================
  // STATEMENT METADATA
  // ============================================================

  let yPos = 105;

  doc
    .font(FONT_BOLD)
    .fontSize(10)
    .fillColor("#000000")
    .text("Statement Date:", 54, yPos);

  doc
    .font(FONT_REG)
    .text(report.generated_at.toUTCString(), 140, yPos);

  yPos += 14;

  doc
    .font(FONT_BOLD)
    .text("Audit Timeline:", 54, yPos);

  doc
    .font(FONT_REG)
    .text(`From: ${startDate} To: ${endDate}`, 140, yPos);

  yPos += 14;

  doc
    .font(FONT_BOLD)
    .text("Company Name:", 54, yPos);

  doc
    .font(FONT_REG)
    .text(
      report.business_context.company_name?.toUpperCase() ?? "N/A",
      140,
      yPos
    );

  yPos += 14;

  doc
    .font(FONT_BOLD)
    .text("Owner Name:", 54, yPos);

  doc
    .font(FONT_REG)
    .text(
      report.business_context.owner_name?.toUpperCase() ?? "N/A",
      140,
      yPos
    );

  // ============================================================
  // SECTION 2: SUMMARY PERFORMANCE METRICS
  // ============================================================

  yPos += 30;

  doc
    .font(FONT_BOLD)
    .fontSize(12)
    .text("TRAFFIC & GENERAL VOLUME SUMMARY", 54, yPos);

  yPos += 18;

  // Headers
  doc
    .fontSize(9)
    .font(FONT_BOLD)
    .text("METRIC DESCRIPTION", 54, yPos);

  doc.text(
    "ACCOUNTING REALITY",
    400,
    yPos,
    {
      width: 141,
      align: "right",
    }
  );

  yPos += 12;

  doc
    .moveTo(54, yPos)
    .lineTo(541, yPos)
    .strokeColor("#777777")
    .lineWidth(0.5)
    .stroke();

  // Object-based rows
  const metricsRows = [
    {
      label: "Total Invoices / Receipts Issued",
      value: `${report.traffic_and_volume.total_receipts_issued}`,
    },
    {
      label: "Average Ticket Size / Basket Value",
      value: `NGN ${report.traffic_and_volume.average_basket_value.toFixed(
        2
      )}`,
    },
    {
      label: "Gross Sales Turn-over Volume",
      value: `NGN ${report.traffic_and_volume.gross_sales_volume.toFixed(
        2
      )}`,
    },
  ];

  metricsRows.forEach((row) => {
    yPos += 16;

    doc
      .font(FONT_REG)
      .fontSize(10)
      .text(row.label, 54, yPos);

    doc.text(
      row.value,
      400,
      yPos,
      {
        width: 141,
        align: "right",
      }
    );
  });

  // ============================================================
  // SECTION 3: REVENUE TRACKING
  // ============================================================

  yPos += 35;

  doc
    .font(FONT_BOLD)
    .fontSize(12)
    .text(
      "DIGITAL SETTLEMENT REVENUE TRACKING",
      54,
      yPos
    );

  yPos += 18;

  doc
    .fontSize(9)
    .font(FONT_BOLD)
    .text(
      "PAYMENT METHOD CHANNEL",
      54,
      yPos
    );

  doc.text(
    "SETTLED INCOME (NGN)",
    400,
    yPos,
    {
      width: 141,
      align: "right",
    }
  );

  yPos += 12;

  doc
    .moveTo(54, yPos)
    .lineTo(541, yPos)
    .strokeColor("#777777")
    .lineWidth(0.5)
    .stroke();

  const paymentRows = [
    {
      label: "Cash Receipts Payouts",
      value: `NGN ${report.gross_revenue_tracking.cash_payouts.toFixed(
        2
      )}`,
    },
    {
      label: "POS Machine Terminal Payouts",
      value: `NGN ${report.gross_revenue_tracking.card_payouts.toFixed(
        2
      )}`,
    },
    {
      label: "Direct Mobile App Bank Transfers",
      value: `NGN ${report.gross_revenue_tracking.transfer_payouts.toFixed(
        2
      )}`,
    },
  ];

  paymentRows.forEach((row) => {
    yPos += 16;

    doc
      .font(FONT_REG)
      .fontSize(10)
      .text(row.label, 54, yPos);

    doc.text(
      row.value,
      400,
      yPos,
      {
        width: 141,
        align: "right",
      }
    );
  });

  // ============================================================
  // SECTION 4: TOP PRODUCTS
  // ============================================================

  yPos += 35;

  doc
    .font(FONT_BOLD)
    .fontSize(12)
    .text(
      "PRODUCT SALES PERFORMANCE VELOCITY LOGS (TOP 5)",
      54,
      yPos
    );

  yPos += 18;

  doc
    .fontSize(9)
    .font(FONT_BOLD)
    .text(
      "PRODUCT NAME DESCRIPTION",
      54,
      yPos
    );

  doc.text(
    "UNITS SOLD",
    340,
    yPos,
    {
      width: 80,
      align: "right",
    }
  );

  doc.text(
    "REVENUE CONTRIBUTION",
    430,
    yPos,
    {
      width: 111,
      align: "right",
    }
  );

  yPos += 12;

  doc
    .moveTo(54, yPos)
    .lineTo(541, yPos)
    .strokeColor("#777777")
    .lineWidth(0.5)
    .stroke();

  // ============================================================
  // PRODUCT DATA
  // ============================================================

  const topProducts =
    report.product_performance.highest_moving_items;

  if (topProducts.length === 0) {
    yPos += 16;

    doc
      .font(FONT_REG)
      .fontSize(10)
      .text(
        "No inventory transactions captured within this selected range.",
        54,
        yPos,
        {
          width: 487,
        }
      );
  } else {
    topProducts.forEach((item) => {
      yPos += 16;

      doc
        .font(FONT_REG)
        .fontSize(10)
        .text(
          item.productName,
          54,
          yPos,
          {
            width: 270,
            lineBreak: false,
          }
        );

      doc.text(
        `${item.unitsSold}`,
        340,
        yPos,
        {
          width: 75,
          align: "right",
        }
      );

      doc.text(
        `NGN ${item.revenueGenerated.toFixed(2)}`,
        430,
        yPos,
        {
          width: 111,
          align: "right",
        }
      );
    });
  }

  // ============================================================
  // DOUBLE BASELINE
  // ============================================================

  yPos += 20;

  doc
    .moveTo(54, yPos)
    .lineTo(541, yPos)
    .strokeColor("#000000")
    .lineWidth(1)
    .stroke();

  doc
    .moveTo(54, yPos + 2)
    .lineTo(541, yPos + 2)
    .strokeColor("#000000")
    .lineWidth(0.5)
    .stroke();

  // ============================================================
  // FOOTER
  // ============================================================

  doc
    .font(FONT_REG)
    .fontSize(8)
    .fillColor("#777777")
    .text(
      "CONFIDENTIAL STATISTICAL STATEMENT - PROCESSED AUTOMATICALLY VIA BAAZIO MULTI-TENANT ENGINE.",
      54,
      755,
      {
        align: "center",
      }
    );

  // ============================================================
  // FINISH PDF
  // ============================================================

  doc.end();

  // ============================================================
  // WAIT FOR FILE TO FINISH WRITING
  // ============================================================

  return new Promise<void>((resolve, reject) => {
    writeStream.on("finish", async () => {
      try {
        const cacheDataPayload = {
          status: "COMPLETED",
          fileUrl: `/api/download-report/${jobId}/pdf`,
        };

        await redis.set(
          `pdf:report:status:${jobId}`,
          JSON.stringify(cacheDataPayload),
          "EX",
          24 * 60 * 60
        );

        console.log(
          `✅ [Baazio Workers]: Job [${jobId}] completely written to disk and cached in Redis RAM.`
        );

        resolve();
      } catch (error) {
        reject(error);
      }
    });

    writeStream.on("error", (error) => {
      reject(error);
    });
  });
};


/**
 * ============================================================
 * CSV REPORT BACKGROUND JOB
 * ============================================================
 */
export const csvReportJob = async (
  data: ReportJobData
): Promise<void> => {
  const {
    business_id,
    startDate,
    endDate,
    jobId,
  } = data;

  // ============================================================
  // 1. ENSURE STORAGE DIRECTORY EXISTS
  // ============================================================

  const storageDirectory = path.resolve("./storage");

  if (!fs.existsSync(storageDirectory)) {
    fs.mkdirSync(storageDirectory, {
      recursive: true,
    });

    console.log(
      `📁 [Baazio Storage]: Created storage directory at ${storageDirectory}`
    );
  }

  // ============================================================
  // 2. GENERATE REPORT DATA
  // ============================================================

  const report = await generateReportService(
    business_id,
    startDate,
    endDate
  );

  // ============================================================
  // 3. BUILD CSV
  // ============================================================

  let csvContent = "";

  // Header
  csvContent += "Baazio BUSINESS PERFORMANCE SUMMARY REPORT\n";

  csvContent += `Generated At,${report.generated_at.toISOString()}\n`;

  csvContent += `Timeline Window,From ${startDate} to ${endDate}\n\n`;

  // ============================================================
  // PILLAR 1
  // ============================================================

  csvContent += "1. TRAFFIC & VOLUME METRICS\n";

  csvContent +=
    "Metric Vector,Calculated Realities\n";

  csvContent +=
    `Total Receipts Issued,${report.traffic_and_volume.total_receipts_issued}\n`;

  csvContent +=
    `Average Basket Value Size,${report.traffic_and_volume.average_basket_value.toFixed(
      2
    )}\n`;

  csvContent +=
    `Gross Sales Volume Revenue,${report.traffic_and_volume.gross_sales_volume.toFixed(
      2
    )}\n\n`;

  // ============================================================
  // PILLAR 2
  // ============================================================

  csvContent +=
    "2. DIGITAL SETTLEMENT REVENUE TRACKING\n";

  csvContent +=
    "Payment Method Channel,Settled Income\n";

  csvContent +=
    `Cash Receipts Payouts,${report.gross_revenue_tracking.cash_payouts.toFixed(
      2
    )}\n`;

  csvContent +=
    `POS Machine Terminal Payouts,${report.gross_revenue_tracking.card_payouts.toFixed(
      2
    )}\n`;

  csvContent +=
    `Direct Mobile App Bank Transfers,${report.gross_revenue_tracking.transfer_payouts.toFixed(
      2
    )}\n\n`;

  // ============================================================
  // PILLAR 3
  // ============================================================

  csvContent +=
    "3. PRODUCT SALES PERFORMANCE VELOCITY LOGS (TOP 5)\n";

  csvContent +=
    "Product Catalog Name,Units Depleted from Stock,Gross Revenue Contribution\n";

  const topProducts =
    report.product_performance.highest_moving_items;

  if (topProducts.length === 0) {
    csvContent +=
      "No stock transactions logged within this date range.,0,0.00\n";
  } else {
    topProducts.forEach((item) => {
      // Remove commas from product names so they don't
      // break CSV columns.
      const safeName = String(item.productName)
        .replace(/,/g, " ")
        .replace(/\r?\n/g, " ");

      csvContent +=
        `${safeName},${item.unitsSold},${item.revenueGenerated.toFixed(
          2
        )}\n`;
    });
  }

  // ============================================================
  // 4. WRITE CSV TO DISK
  // ============================================================

  const outputFilePath = path.join(
    storageDirectory,
    `Baazio_Report_${jobId}.csv`
  );

  await fs.promises.writeFile(
    outputFilePath,
    csvContent,
    "utf8"
  );

  // ============================================================
  // 5. CACHE SUCCESS STATUS
  // ============================================================

  const cacheDataPayload = {
    status: "COMPLETED",
    fileUrl: `/api/download-report/${jobId}/csv`,
  };

  await redis.set(
    `csv:report:status:${jobId}`,
    JSON.stringify(cacheDataPayload),
    "EX",
    24 * 60 * 60
  );

  console.log(
    `✅ [Baazio Workers]: CSV Spreadsheet [${jobId}] completely written to disk and cached in Redis.`
  );
};