import express from "express";
import {
  protect,
  superAdminOnly,
} from "../middleware/authMiddleware.js";
import {
  createCompanyWithAdmin,
} from "../controllers/superAdminController.js";

const router = express.Router();

/* ================= SUPER ADMIN ROUTES ================= */

/**
 * @route   POST /api/superadmin/company
 * @desc    Create company + admin (Super Admin only)
 */
router.post(
  "/company",
  protect,
  superAdminOnly,
  createCompanyWithAdmin
);

export default router;
