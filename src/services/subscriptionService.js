import Subscription from "../models/Subscription.js";
import User from "../models/user.js";

/**
 * Calculate subscription end date based on plan type
 */
const calculateEndDate = (planType) => {
  const startDate = new Date();
  const endDate = new Date(startDate);

  if (planType === "monthly") {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  if (planType === "yearly") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  return endDate;
};

/**
 * Activate or update user subscription
 */
export const activateSubscription = async ({ userId, planType }) => {
  if (!["free", "monthly", "yearly"].includes(planType)) {
    throw new Error("Invalid subscription plan");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const existingSubscription = await Subscription.findOne({
    userId,
    status: "active",
  });

  // ❌ Free plan sirf ek baar
  if (planType === "free" && user.freePlanUsed) {
    throw new Error("Free plan can be used only once");
  }

  // ❌ Monthly active → yearly only
  if (
    existingSubscription &&
    existingSubscription.planType === "monthly" &&
    planType === "monthly"
  ) {
    throw new Error("You can upgrade only to Yearly plan");
  }

  // ❌ Yearly active → no upgrade
  if (
    existingSubscription &&
    existingSubscription.planType === "yearly"
  ) {
    throw new Error("You already have Pro Yearly Plan");
  }

  const startDate = new Date();
  const endDate =
    planType === "free" ? null : calculateEndDate(planType);

  // expire old active subscriptions
  if (existingSubscription) {
    existingSubscription.status = "expired";
    await existingSubscription.save();
  }

  // create new subscription
  const subscription = await Subscription.create({
    userId,
    planType,
    status: "active",
    startDate,
    endDate,
    autoRenew: false,
    freePlanUsed: planType === "free",
  });

  // update user
  await User.findByIdAndUpdate(userId, {
    planType,
    subscriptionStatus: "active",
    subscriptionStartDate: startDate,
    subscriptionEndDate: endDate,
    bookingLimit: planType === "free" ? 10 : Infinity,
    bookingUsed: 0,
    freePlanUsed: planType === "free" ? true : user.freePlanUsed,
  });

  return subscription;
};

/**
 * Expire subscription (used by cron / manual check)
 */
export const expireSubscription = async (userId) => {
  await Subscription.updateMany(
    { userId, status: "active" },
    { status: "expired" }
  );

  await User.findByIdAndUpdate(userId, {
    subscriptionStatus: "expired",
    subscriptionEndDate: null,
  });
};
