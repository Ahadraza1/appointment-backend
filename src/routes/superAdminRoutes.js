import express from "express";
import { protect, superAdminOnly } from "../middlewares/authMiddleware.js";
import {
  createCompanyWithAdmin,
  getAllCompanies,
  toggleCompanyStatus,
  getCompanyAdmins,
  getCompanyStats,
  getAllCompanyAdmins,
  deleteCompany,
  getCompanyServices,
  getCompanyCustomers,
  getCompanyCustomerAppointments,
} from "../controllers/superAdminController.js";

import {
  createService,
  updateService,
  toggleServiceStatus,
  deleteService,
} from "../controllers/serviceController.js";

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
 * @route   DELETE /api/superadmin/company/:id
 * @desc    Delete company and related data (Super Admin only)
 */
router.delete("/company/:id", protect, superAdminOnly, deleteCompany);

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

/**
 * @route   GET /api/superadmin/company/:companyId/services
 * @desc    Get services of a company (Super Admin only)
 */
router.get(
  "/company/:companyId/services",
  protect,
  superAdminOnly,
  getCompanyServices
);


/**
 * @route   GET /api/superadmin/company/:companyId/customers
 * @desc    Get customers of a company (Super Admin only)
 */
router.get(
  "/company/:companyId/customers",
  protect,
  superAdminOnly,
  getCompanyCustomers
);

/**
 * @route   GET /api/superadmin/company/:companyId/customers/:customerId/appointments
 * @desc    Get appointments of a specific customer in a company (Super Admin only)
 */
router.get(
  "/company/:companyId/customers/:customerId/appointments",
  protect,
  superAdminOnly,
  getCompanyCustomerAppointments
);

/* ================= SUPER ADMIN - COMPANY SERVICES CRUD ================= */

/**
 * @route   POST /api/superadmin/company/:companyId/services
 * @desc    Create service for a company (Super Admin)
 */
router.post(
  "/company/:companyId/services",
  protect,
  superAdminOnly,
  createService
);

/**
 * @route   PUT /api/superadmin/services/:serviceId
 * @desc    Update service (Super Admin)
 */
router.put(
  "/services/:serviceId",
  protect,
  superAdminOnly,
  updateService
);

/**
 * @route   PATCH /api/superadmin/services/:serviceId/status
 * @desc    Toggle service active/inactive (Super Admin)
 */
router.patch(
  "/services/:serviceId/status",
  protect,
  superAdminOnly,
  toggleServiceStatus
);

/**
 * @route   DELETE /api/superadmin/services/:serviceId
 * @desc    Delete service (Super Admin)
 */
router.delete(
  "/services/:serviceId",
  protect,
  superAdminOnly,
  deleteService
);


export default router;
