import express from "express";
import {
  updateUserProfile,
  updateUserPassword,
  forgotPassword,
  resetPassword,
  uploadProfilePhoto,
  upload,
} from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

/* ================= USER PROFILE ================= */

// Update profile photo
router.patch(
  "/profile-photo",
  protect,
  upload.single("photo"),
  uploadProfilePhoto
);

// Update profile (name, email)
router.put("/profile", protect, updateUserProfile);

// Update password
router.put("/profile/password", protect, updateUserPassword);

// Forgot password and reset password
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

export default router;
