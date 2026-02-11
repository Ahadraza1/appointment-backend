import User from "../models/user.js";
import Company from "../models/Company.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

/* ---------------- REGISTER ---------------- */
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, companyId } = req.body;

    if (!name || !email || !phone || !password || !role) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    if (role === "admin" && !companyId) {
      return res.status(400).json({
        message: "Admin must be assigned to a company",
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
      companyId: role === "admin" ? companyId : null,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePhoto: user.profilePhoto,
      companyId: user.companyId || null,
      planType: user.planType,
      bookingUsed: user.bookingUsed,
      bookingLimit: user.bookingLimit,
      subscriptionEndDate: user.subscriptionEndDate,
      subscriptionStatus: user.subscriptionStatus,
      token: generateToken(user._id, user.role, user.companyId || null),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/* ---------------- LOGIN ---------------- */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 🔒 Admin must have company
    if (user.role === "admin" && !user.companyId) {
      return res.status(403).json({
        message: "Admin is not assigned to any company",
      });
    }

    // 🔒 Block admin if company inactive
    if (user.role === "admin" && user.companyId) {
      const company = await Company.findById(user.companyId);

      if (!company || company.status !== "active") {
        return res.status(403).json({
          message: "Your company is inactive. Please contact Super Admin.",
        });
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePhoto: user.profilePhoto,
      companyId: user.companyId || null,

      // ✅ PLAN FIELDS ADDED
      planType: user.planType,
      bookingUsed: user.bookingUsed,
      bookingLimit: user.bookingLimit,
      subscriptionEndDate: user.subscriptionEndDate,
      subscriptionStatus: user.subscriptionStatus,

      token: generateToken(user._id, user.role, user.companyId || null),
    });
  } catch (error) {
    next(error);
  }
};

/* ---------------- GET CURRENT USER (ME) ---------------- */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
