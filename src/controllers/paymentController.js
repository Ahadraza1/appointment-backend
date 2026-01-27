import Payment from "../models/Payment.js";
import { activateSubscription } from "../services/subscriptionService.js";
import paypalClient from "../config/paypal.js";
import paypal from "@paypal/checkout-server-sdk";

/**
 * @desc    Handle payment success (manual / non-gateway)
 * @route   POST /api/payment/success
 * @access  Private
 */
export const paymentSuccessController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planType, amount, paymentGateway, gatewayPaymentId } = req.body;

    if (!planType || !amount) {
      return res.status(400).json({
        success: false,
        message: "Plan type and amount are required",
      });
    }

    const payment = await Payment.create({
      userId,
      planType,
      amount,
      paymentGateway: paymentGateway || "manual",
      gatewayPaymentId: gatewayPaymentId || null,
      status: "success",
    });

    const subscription = await activateSubscription({
      userId,
      planType,
    });

    payment.subscriptionId = subscription._id;
    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Payment successful and subscription activated",
      data: {
        paymentId: payment._id,
        subscriptionId: subscription._id,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Payment success handling failed",
    });
  }
};

/**
 * @desc    Handle payment failure
 * @route   POST /api/payment/failed
 * @access  Private
 */
export const paymentFailedController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planType, amount, paymentGateway, failureReason } = req.body;

    if (!planType || !amount) {
      return res.status(400).json({
        success: false,
        message: "Plan type and amount are required",
      });
    }

    await Payment.create({
      userId,
      planType,
      amount,
      paymentGateway: paymentGateway || "manual",
      status: "failed",
      failureReason: failureReason || "Payment failed",
    });

    return res.status(200).json({
      success: false,
      message: "Payment failed",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Payment failure handling failed",
    });
  }
};

/* =========================================================
   PAYPAL INTEGRATION (NEW – ADDITIVE ONLY)
   ========================================================= */

/**
 * @desc    Create PayPal order
 * @route   POST /api/payment/paypal/create-order
 * @access  Private
 */
export const createPaypalOrderController = async (req, res) => {
  try {
    const { amount } = req.body;

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount.toString(),
          },
        },
      ],
    });

    const order = await paypalClient.execute(request);

    return res.status(200).json({
      success: true,
      orderId: order.result.id,
    });
  } catch (error) {
    console.error("PAYPAL CREATE ORDER ERROR 👉", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create PayPal order",
    });
  }
};

/**
 * @desc    Capture PayPal payment
 * @route   POST /api/payment/paypal/capture
 * @access  Private
 */
export const capturePaypalPaymentController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId, planType, amount } = req.body;

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const capture = await paypalClient.execute(request);

    // 🔍 IMPORTANT: PayPal status check
    if (capture.result.status !== "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: `PayPal payment not completed. Current status: ${capture.result.status}`,
        paypalStatus: capture.result.status,
      });
    }

    // ✅ Payment success
    const payment = await Payment.create({
      userId,
      planType,
      amount,
      paymentGateway: "paypal",
      gatewayPaymentId: capture.result.id,
      status: "success",
    });

    const subscription = await activateSubscription({
      userId,
      planType,
    });

    payment.subscriptionId = subscription._id;
    await payment.save();

    return res.status(200).json({
      success: true,
      message: "PayPal payment captured successfully",
    });
  } catch (error) {
    console.error("PAYPAL CAPTURE ERROR 👉", error);

    return res.status(500).json({
      success: false,
      message: "PayPal capture API failed",
    });
  }
};
