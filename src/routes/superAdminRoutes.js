import express from "express";
import { protect, superAdminOnly } from "../middlewares/authMiddleware.js";
import {
  createCompanyWithAdmin,
  getAllCompanies,
  toggleCompanyStatus,
  getCompanyAdmins,
  getCompanyStats,
  getAllCompanyAdmins,
} from "../controllers/superAdminController.js";

const router = express.Router();

/* ================= SUPER ADMIN ROUTES ================= */

/**
 * @route   POST /api/superadmin/company
 * @desc    Create company + admin (Super Admin only)
 */
router.post("/company", protect, superAdminOnly, createCompanyWithAdmin);

/**
 * @route   GET /api/superadmin/companies
 * @desc    Get all companies (Super Admin only)
 */
router.get("/companies", protect, superAdminOnly, getAllCompanies);

/**
 * @route   PATCH /api/superadmin/company/:id/status
 * @desc    Enable / Disable company (Super Admin only)
 */
router.patch(
  "/company/:id/status",
  protect,
  superAdminOnly,
  toggleCompanyStatus,
);

/**
 * @route   GET /api/superadmin/company/:companyId/admins
 * @desc    Get admins of a company (Super Admin only)
 */
router.get(
  "/company/:companyId/admins",
  protect,
  superAdminOnly,
  getCompanyAdmins,
);

/**
 * @route   GET /api/superadmin/company/:companyId/stats
 * @desc    Get company stats (Super Admin only)
 */
router.get(
  "/company/:companyId/stats",
  protect,
  superAdminOnly,
  getCompanyStats,
);

/**
 * @route   GET /api/superadmin/company-admins
 * @desc    Get all company admins (Super Admin only)
 */
router.get("/company-admins", protect, superAdminOnly, getAllCompanyAdmins);

export default router;
