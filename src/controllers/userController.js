import User from "../models/user.js";
import crypto from "crypto";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= MULTER CONFIG (MEMORY STORAGE) ================= */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload only images."), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

/* ================= UPDATE PROFILE ================= */
export const updateUserProfile = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    res.status(500).json({ message: "Profile update failed" });
  }
};

/* ================= UPDATE PASSWORD (FINAL FIX) ================= */
export const updateUserPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both passwords are required" });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // ✅ ALWAYS refetch user WITH password
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect" });
    }

    user.password = newPassword; // 🔐 hashed by pre-save hook
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("UPDATE PASSWORD ERROR:", error);
    res.status(500).json({ message: "Password update failed" });
  }
};

/* ================= FORGOT PASSWORD ================= */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token & save
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins

    await user.save();

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    // 🔴 TEMP: send link in response (later replace with email)
    res.json({
      message: "Password reset link generated",
      resetUrl,
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    res.status(500).json({ message: "Forgot password failed" });
  }
};

/* ================= RESET PASSWORD ================= */
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({ message: "Reset password failed" });
  }
};

/* ================= UPLOAD PROFILE PHOTO ================= */
export const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Process image with sharp
    const fileName = `user-${user._id}-${Date.now()}.jpeg`;
    const uploadPath = path.join(__dirname, "../../uploads/profile-photos");

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    await sharp(req.file.buffer)
      .resize(256, 256)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(path.join(uploadPath, fileName));

    // Delete old photo if it exists
    if (user.profilePhoto) {
      const oldPath = path.join(__dirname, "../..", user.profilePhoto);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update user record
    const photoUrl = `/uploads/profile-photos/${fileName}`;
    user.profilePhoto = photoUrl;
    await user.save();

    res.json({
      message: "Profile photo uploaded successfully",
      profilePhoto: photoUrl,
    });
  } catch (error) {
    console.error("UPLOAD PROFILE PHOTO ERROR:", error);
    res.status(500).json({ message: error.message || "Upload failed" });
  }
};

/* ================= GET USER PROFILE (FOR PLAN + BOOKING DATA) ================= */
export const getUserProfile = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const user = await User.findById(req.user._id).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("GET USER PROFILE ERROR:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};