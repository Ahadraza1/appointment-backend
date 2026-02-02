import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

router.get("/invoice/:invoiceNumber", async (req, res) => {
  try {
    const { invoiceNumber } = req.params;

    if (!invoiceNumber) {
      return res.status(400).json({
        success: false,
        message: "Invoice number required",
      });
    }

    const filePath = path.join(
      process.cwd(),
      "invoices",
      `${invoiceNumber}.pdf`
    );

    // LIVE SAFE: file exists check
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.download(filePath);
  } catch (error) {
    console.error("Invoice download error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to download invoice",
    });
  }
});

export default router;
