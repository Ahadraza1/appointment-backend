import express from "express";
import mongoose from "mongoose"; // 🔥 NEW IMPORT
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import User from "../models/user.js";
import Service from "../models/Service.js";
import Appointment from "../models/Appointment.js";
import Availability from "../models/Availability.js";
import {
  getSettings,
  updateSettings,
} from "../controllers/adminSettingsController.js";
import { getTodayAppointments } from "../controllers/appointmentController.js";

const router = express.Router();

/* ================= ADMIN DASHBOARD ================= */
router.get("/dashboard", protect, adminOnly, async (req, res) => {
  try {
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const totalServices = await Service.countDocuments();
    const totalAppointments = await Appointment.countDocuments();

    res.json({
      totalCustomers,
      totalServices,
      totalAppointments,
    });
  } catch (error) {
    res.status(500).json({ message: "Dashboard data error" });
  }
});

/* ================= CUSTOMERS ================= */
router.get("/customers", protect, adminOnly, async (req, res) => {
  try {
    const customers = await User.find({ role: "customer" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: "Failed to load customers" });
  }
});

/* ================= SERVICES ================= */
router.get("/services", protect, adminOnly, async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: "Failed to load services" });
  }
});

/* ================= APPOINTMENTS ================= */

// GET /api/admin/appointments?userId=xxxx
router.get("/appointments", protect, adminOnly, async (req, res) => {
  try {
    const { userId } = req.query;

    const filter = {};
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.userId = userId; // 🔥 MAIN FIX
    }

    const appointments = await Appointment.find(filter)
      .populate("userId", "name email")
      .populate("serviceId", "name price duration")
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (error) {
    console.error("ADMIN APPOINTMENTS ERROR:", error);
    res.status(500).json({ message: "Failed to load appointments" });
  }
});

// PUT /api/admin/appointments/:id/status
router.put("/appointments/:id/status", protect, adminOnly, async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: "Request body is missing",
      });
    }

    const { status, rejectionReason } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        status,
        rejectionReason:
          status === "rejected" ? rejectionReason || "No reason provided" : "",
      },
      { new: true }
    );

    if (!updatedAppointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({
      message: "Appointment updated successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error);
    res.status(500).json({
      message: "Failed to update appointment",
      error: error.message,
    });
  }
});

// Today Appointment
router.get("/today", protect, adminOnly, getTodayAppointments);

/* ================= AVAILABILITY (ADMIN) ================= */
// GET /api/admin/availability
router.get("/availability", protect, adminOnly, async (req, res) => {
  try {
    let availability = await Availability.findOne();

    // first time create
    if (!availability) {
      availability = await Availability.create({
        workingDays: [],
        startTime: "09:00",
        endTime: "18:00",
        breaks: [],
        holidays: [],
      });
    }

    res.json(availability);
  } catch (error) {
    console.error("ADMIN AVAILABILITY ERROR:", error);
    res.status(500).json({ message: "Failed to load availability" });
  }
});

// PUT /api/admin/availability
router.put("/availability", protect, adminOnly, async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: "Availability data is missing",
      });
    }

    const { workingDays, startTime, endTime, breaks, holidays } = req.body;

    const updatedAvailability = await Availability.findOneAndUpdate(
      {},
      {
        $set: {
          workingDays,
          startTime,
          endTime,
          breaks,
          holidays,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.json(updatedAvailability);
  } catch (error) {
    console.error("UPDATE AVAILABILITY ERROR:", error);
    res.status(500).json({
      message: "Failed to update availability",
      error: error.message,
    });
  }
});

/* ================= SETTINGS ================= */
router.get("/settings", protect, adminOnly, getSettings);
router.put("/settings", protect, adminOnly, updateSettings);

export default router;
