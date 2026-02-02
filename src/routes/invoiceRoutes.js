import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

/**
 * @desc    Download invoice PDF
 * @route   GET /api/invoice/:invoiceNumber
 * @access  Private
 */
router.get("/:invoiceNumber", (req, res) => {
  try {
    const { invoiceNumber } = req.params;

    if (!invoiceNumber) {
      return res.status(400).json({
        success: false,
        message: "Invoice number is required",
      });
    }

    const filePath = path.join(
      process.cwd(),
      "invoices",
      `${invoiceNumber}.pdf`
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.download(filePath);
  } catch (error) {
    console.error("Invoice download error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to download invoice",
    });
  }
});

export default router;
