import express from "express";
import {
  paymentSuccessController,
  paymentFailedController,
  createPaypalOrderController,
  capturePaypalPaymentController,
} from "../controllers/paymentController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/payment/success
 * @desc    Handle successful payment
 * @access  Private (Customer)
 */
router.post(
  "/success",
  authMiddleware,
  paymentSuccessController
);

/**
 * @route   POST /api/payment/failed
 * @desc    Handle failed payment
 * @access  Private (Customer)
 */
router.post(
  "/failed",
  authMiddleware,
  paymentFailedController
);

/* =========================================================
   PAYPAL ROUTES (NEW – ADDITIVE ONLY)
   ========================================================= */

/**
 * @route   POST /api/payment/paypal/create-order
 * @desc    Create PayPal order
 * @access  Private (Customer)
 */
router.post(
  "/paypal/create-order",
  authMiddleware,
  createPaypalOrderController
);

/**
 * @route   POST /api/payment/paypal/capture
 * @desc    Capture PayPal payment
 * @access  Private (Customer)
 */
router.post(
  "/paypal/capture",
  authMiddleware,
  capturePaypalPaymentController
);

export default router;
