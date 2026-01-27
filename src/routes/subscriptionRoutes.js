import express from "express";
import {
  activateSubscriptionController,
  expireSubscriptionController,
} from "../controllers/subscriptionController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/subscription/activate
 * @desc    Activate subscription after payment success
 * @access  Private (Customer)
 */
router.post(
  "/activate",
  authMiddleware,
  activateSubscriptionController
);

/**
 * @route   POST /api/subscription/expire
 * @desc    Expire subscription (manual / cron / admin)
 * @access  Private (Admin/System)
 */
router.post(
  "/expire",
  authMiddleware,
  expireSubscriptionController
);

export default router;
