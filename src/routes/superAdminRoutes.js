import express from "express";
import { protect, superAdminOnly } from "../middlewares/authMiddleware.js";
import Appointment from "../models/Appointment.js";
import upload from "../middlewares/uploadMiddleware.js";
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
  getSuperAdminProfile,
  updateSuperAdminProfile,
  changeSuperAdminPassword,
  updateSuperAdminProfilePhoto,
  removeSuperAdminProfilePhoto,
  impersonateCompanyAdmin,
  changeCompanyAdminPassword,
  getAllCustomers,
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
 * @route   POST /api/superadmin/impersonate-company-admin
 * @desc    Login as company admin (Super Admin only)
 */
router.post(
  "/impersonate-company-admin",
  protect,
  superAdminOnly,
  impersonateCompanyAdmin,
);

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
 * @route   GET /api/superadmin/customers
 * @desc    Get all registered customers (Super Admin only)
 */
router.get("/customers", protect, superAdminOnly, getAllCustomers);

/**
 * @route   PUT /api/superadmin/company-admins/:adminId/password
 * @desc    Change company admin password (Super Admin only)
 */
router.put(
  "/company-admins/:adminId/password",
  protect,
  superAdminOnly,
  changeCompanyAdminPassword,
);

/**
 * @route   GET /api/superadmin/company/:companyId/services
 * @desc    Get services of a company (Super Admin only)
 */
router.get(
  "/company/:companyId/services",
  protect,
  superAdminOnly,
  getCompanyServices,
);

/**
 * @route   GET /api/superadmin/company/:companyId/customers
 * @desc    Get customers of a company (Super Admin only)
 */
router.get(
  "/company/:companyId/customers",
  protect,
  superAdminOnly,
  getCompanyCustomers,
);

/**
 * @route   GET /api/superadmin/company/:companyId/customers/:customerId/appointments
 * @desc    Get appointments of a specific customer in a company (Super Admin only)
 */
router.get(
  "/company/:companyId/customers/:customerId/appointments",
  protect,
  superAdminOnly,
  getCompanyCustomerAppointments,
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
  createService,
);

/**
 * @route   PUT /api/superadmin/services/:serviceId
 * @desc    Update service (Super Admin)
 */
router.put("/services/:serviceId", protect, superAdminOnly, updateService);

/**
 * @route   PATCH /api/superadmin/services/:serviceId/status
 * @desc    Toggle service active/inactive (Super Admin)
 */
router.patch(
  "/services/:serviceId/status",
  protect,
  superAdminOnly,
  toggleServiceStatus,
);

/**
 * @route   DELETE /api/superadmin/services/:serviceId
 * @desc    Delete service (Super Admin)
 */
router.delete("/services/:serviceId", protect, superAdminOnly, deleteService);

// UPDATE APPOINTMENT STATUS (SUPER ADMIN)
router.put(
  "/appointments/:id/status",
  protect,
  superAdminOnly,
  async (req, res) => {
    try {
      const { status, rejectionReason } = req.body;

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const updatedAppointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        {
          status,
          rejectionReason:
            status === "rejected"
              ? rejectionReason || "No reason provided"
              : "",
        },
        { new: true },
      );

      if (!updatedAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      res.json({
        message: "Appointment updated successfully",
        appointment: updatedAppointment,
      });
    } catch (error) {
      console.error("SUPERADMIN UPDATE STATUS ERROR:", error);
      res.status(500).json({
        message: "Failed to update appointment",
      });
    }
  },
);

// ================= SUPERADMIN ACCOUNT SETTINGS =================
router.get("/profile", protect, superAdminOnly, getSuperAdminProfile);

router.put("/profile", protect, superAdminOnly, updateSuperAdminProfile);

router.put(
  "/change-password",
  protect,
  superAdminOnly,
  changeSuperAdminPassword,
);

// ================= SUPERADMIN PROFILE PHOTO =================
router.put(
  "/profile/photo",
  protect,
  superAdminOnly,
  upload.single("profilePhoto"),
  updateSuperAdminProfilePhoto,
);

router.put(
  "/profile/photo/remove",
  protect,
  superAdminOnly,
  removeSuperAdminProfilePhoto,
);

export default router;
