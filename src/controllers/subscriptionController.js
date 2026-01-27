import {
  activateSubscription,
  expireSubscription,
} from "../services/subscriptionService.js";

/**
 * @desc    Activate subscription after successful payment
 * @route   POST /api/subscription/activate
 * @access  Private
 */
export const activateSubscriptionController = async (req, res) => {
  try {
    const { planType } = req.body;
    const userId = req.user.id;
    const currentPlan = req.user.subscriptionPlan; // FREE | MONTHLY | YEARLY
    const isExpired = req.user.isSubscriptionExpired;

    if (!planType) {
      return res.status(400).json({
        success: false,
        message: "Plan type is required",
      });
    }

    // ❌ Free plan sirf ek baar
    if (planType === "FREE" && currentPlan === "FREE") {
      return res.status(400).json({
        success: false,
        message: "Free plan can be used only once",
      });
    }

    // ❌ Monthly active → sirf yearly allowed
    if (currentPlan === "MONTHLY" && !isExpired && planType === "MONTHLY") {
      return res.status(400).json({
        success: false,
        message: "You already have Monthly Plan. Upgrade to Yearly only.",
      });
    }

    // ❌ Yearly active → koi upgrade allowed nahi
    if (currentPlan === "YEARLY" && !isExpired) {
      return res.status(400).json({
        success: false,
        message: "You already have Pro Yearly Plan",
      });
    }

    const subscription = await activateSubscription({
      userId,
      planType,
    });

    return res.status(200).json({
      success: true,
      message: "Subscription activated successfully",
      data: subscription,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Subscription activation failed",
    });
  }
};

/**
 * @desc    Expire subscription (manual / cron)
 * @route   POST /api/subscription/expire
 * @access  Private (Admin / System)
 */
export const expireSubscriptionController = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    await expireSubscription(userId);

    return res.status(200).json({
      success: true,
      message: "Subscription expired successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to expire subscription",
    });
  }
};
