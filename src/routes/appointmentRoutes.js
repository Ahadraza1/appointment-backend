import express from "express";
import {
  bookAppointment,
  getMyAppointments,
  getAllAppointments,
  getTodayAppointments,
  getAppointmentDetails,
  updateAppointmentStatus,
  cancelAppointment,
  rescheduleAppointment,
} from "../controllers/appointmentController.js";

import { validateFields } from "../middlewares/validateMiddleware.js";
import {
  protect,
  adminOnly,
  customerOnly,
  checkSubscription,
} from "../middlewares/authMiddleware.js";

import bookingLimitMiddleware from "../middlewares/bookinglimitMiddleware.js";

const router = express.Router();

/* ================= CUSTOMER ROUTES ================= */

// 🔥 BOOK APPOINTMENT
router.post(
  "/",
  protect,
  customerOnly,
  checkSubscription,
  bookingLimitMiddleware,
  validateFields(["serviceId", "date", "timeSlot"]),
  bookAppointment,
);

// 🔥 MY APPOINTMENTS
router.get("/my", protect, customerOnly, getMyAppointments);

// 🔥 CANCEL APPOINTMENT
router.put("/:id/cancel", protect, customerOnly, cancelAppointment);

// 🔥 RESCHEDULE APPOINTMENT
router.put(
  "/:id/reschedule",
  protect,
  customerOnly,
  checkSubscription,
  rescheduleAppointment,
);

/* ================= ADMIN ROUTES ================= */

// 🔥 TODAY APPOINTMENTS
router.get("/today", protect, adminOnly, getTodayAppointments);

// 🔥 ALL APPOINTMENTS
router.get("/", protect, adminOnly, getAllAppointments);

// 🔥 UPDATE STATUS
router.put("/:id/status", protect, adminOnly, updateAppointmentStatus);

/* ================= DYNAMIC ROUTE (LAST) ================= */

// 🔥 SINGLE APPOINTMENT DETAILS
router.get("/:id", protect, getAppointmentDetails);

export default router;
