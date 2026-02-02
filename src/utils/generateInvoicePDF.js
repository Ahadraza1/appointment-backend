import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const generateInvoicePDF = async (invoice) => {
  try {
    // invoices folder (safe absolute path)
    const invoicesDir = path.join(process.cwd(), "invoices");

    // create folder if not exists (LIVE SAFE)
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir);
    }

    const filePath = path.join(
      invoicesDir,
      `${invoice.invoiceNumber}.pdf`
    );

    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // ===== INVOICE CONTENT =====
    doc.fontSize(20).text("BOOKME INVOICE", { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(`Transaction ID: ${invoice.transactionId}`);
    doc.text(`Status: ${invoice.status}`);
    doc.text(`Date: ${new Date(invoice.issueDate).toDateString()}`);
    doc.moveDown();

    doc.text(`Plan: ${invoice.plan}`);
    doc.text(`Billing Cycle: ${invoice.billingCycle}`);
    doc.text(`Amount Paid: $${invoice.amount}`);
    doc.moveDown();

    doc.text(
      "This is a system generated invoice. No signature required.",
      { align: "center" }
    );

    doc.end();

    return filePath;
  } catch (error) {
    console.error("Invoice PDF generation failed:", error);
    return null; // ❗ LIVE SAFE: never throw
  }
};

export default generateInvoicePDF;
