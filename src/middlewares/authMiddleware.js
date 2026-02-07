import jwt from "jsonwebtoken";
import User from "../models/user.js";

/* ================= PROTECT ================= */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { id, role, companyId }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // 🔒 IMPORTANT: lock companyId from token
    req.user = {
      ...user.toObject(),
      role: user.role,
      companyId: user.companyId || null,
    };

    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

/* ================= SUBSCRIPTION GUARD ================= */
export const checkSubscription = (req, res, next) => {
  const user = req.user;

  if (user.subscriptionStatus === "expired") {
    return res.status(403).json({
      message: "Your plan has expired. Please upgrade to continue.",
      redirect: "pricing",
    });
  }

  if (
    user.planType === "free" &&
    user.bookingLimit !== Infinity &&
    user.bookingUsed >= user.bookingLimit
  ) {
    return res.status(403).json({
      message:
        "Your free plan booking limit is over. Please upgrade to Monthly or Yearly plan.",
      redirect: "pricing",
    });
  }

  next();
};

/* ================= ADMIN ONLY ================= */
export const adminOnly = (req, res, next) => {
  if (req.user?.role === "admin" || req.user?.role === "superadmin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access required" });
};

/* ================= SUPER ADMIN ONLY ================= */
export const superAdminOnly = (req, res, next) => {
  if (req.user?.role === "superadmin") {
    return next();
  }
  return res.status(403).json({ message: "Super Admin access required" });
};

/* ================= CUSTOMER ONLY ================= */
export const customerOnly = (req, res, next) => {
  if (req.user?.role === "customer") {
    return next();
  }
  return res.status(403).json({ message: "Customer access required" });
};

export default protect;
