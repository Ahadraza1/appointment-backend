import User from "../models/user.js";
import Company from "../models/Company.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

/* ---------------- REGISTER ---------------- */
export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password) {
      res.status(400);
      throw new Error("Please fill all required fields");
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
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePhoto: user.profilePhoto,
      companyId: user.companyId || null,
      token: generateToken(user._id, user.role, user.companyId || null),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------- LOGIN ---------------- */
export const loginUser = async (req, res) => {
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

    /* 🔒 BLOCK ADMIN LOGIN IF COMPANY IS INACTIVE */
    if (user.role === "admin" && user.companyId) {
      const company = await Company.findById(user.companyId);

      if (!company || company.status !== "active") {
        return res.status(403).json({
          message:
            "Your company is inactive. Please contact Super Admin.",
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
      token: generateToken(user._id, user.role, user.companyId || null),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
