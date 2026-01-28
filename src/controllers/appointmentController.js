import mongoose from "mongoose";
import transporter from "../config/mail.config.js";
import Appointment from "../models/Appointment.js";
import Service from "../models/Service.js";
import Availability from "../models/Availability.js";
import User from "../models/user.js";

/* ================= BOOK APPOINTMENT ================= */
export const bookAppointment = async (req, res) => {
  try {
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const { serviceId, date, timeSlot, notes } = req.body;

    if (!serviceId || !date || !timeSlot) {
      return res.status(400).json({ message: "Missing booking details" });
    }

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ message: "Invalid serviceId" });
    }

    /* ================= LOAD SERVICE ================= */
    const service = await Service.findById(serviceId);

    if (!service || service.status !== "active") {
      return res.status(400).json({ message: "Service not available" });
    }

    /* ================= PLAN & BOOKING LIMIT CHECK ================= */
    const user = await User.findById(req.user._id);

    // ❌ Subscription expired
    if (user.subscriptionStatus === "expired") {
      return res.status(403).json({
        message: "Your plan has expired. Please upgrade your plan to continue.",
        redirect: "pricing",
      });
    }

    // ❌ Free plan booking limit over
    if (
      user.planType === "free" &&
      user.bookingLimit !== Infinity &&
      user.bookingUsed >= user.bookingLimit
    ) {
      return res.status(403).json({
        message:
          "Your free plan booking limit is over. Please upgrade to Monthly or Yearly plan.",
        redirect: "pricing",
      });
    }

    /* ================= LOAD GLOBAL AVAILABILITY ================= */
    const availability = await Availability.findOne();

    if (!availability) {
      return res.status(400).json({ message: "Availability not configured" });
    }

    if (!availability.bookingOpen) {
      return res.status(400).json({ message: "Booking is currently closed" });
    }

    /* ================= PICK RULE SOURCE ================= */
    const rules = service.availabilityEnabled ? service : availability;

    /* ================= DAY CHECK ================= */
    const bookingDate = new Date(date);
    const dayName = bookingDate.toLocaleDateString("en-US", {
      weekday: "long",
    });

    if (rules.workingDays?.length && !rules.workingDays.includes(dayName)) {
      return res
        .status(400)
        .json({ message: "Bookings are closed on this day" });
    }

    /* ================= HOLIDAY CHECK ================= */
    if (rules.holidays?.includes(date)) {
      return res
        .status(400)
        .json({ message: "Bookings are closed on holidays" });
    }

    /* ================= WORKING HOURS CHECK ================= */
    const slotMinutes = timeToMinutes(timeSlot);

    if (rules.startTime && rules.endTime) {
      const startMinutes = timeToMinutes(rules.startTime);
      const endMinutes = timeToMinutes(rules.endTime);

      if (slotMinutes < startMinutes || slotMinutes >= endMinutes) {
        return res.status(400).json({
          message: "Booking allowed only during working hours",
        });
      }
    }

    for (const brk of rules.breaks || []) {
      const breakStart = timeToMinutes(brk.start);
      const breakEnd = timeToMinutes(brk.end);

      if (slotMinutes >= breakStart && slotMinutes < breakEnd) {
        return res.status(400).json({
          message: "Booking not allowed during break time",
        });
      }
    }

    /* ================= BREAK TIME CHECK ================= */
    for (const brk of rules.breaks || []) {
      if (timeSlot >= brk.start && timeSlot < brk.end) {
        return res.status(400).json({
          message: "Booking not allowed during break time",
        });
      }
    }

    /* ================= CONFLICT CHECK ================= */
    const conflict = await Appointment.findOne({
      serviceId,
      date,
      timeSlot,
      status: { $ne: "rejected" },
    });

    if (conflict) {
      return res
        .status(400)
        .json({ message: "This time slot is already booked" });
    }

    /* ================= CREATE APPOINTMENT ================= */
    const appointment = await Appointment.create({
      userId: req.user._id,
      serviceId,
      date,
      timeSlot,
      notes,
      status: "pending",
    });

    /* ================= INCREMENT BOOKING COUNT ================= */
    await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { bookingUsed: 1 } },
      { new: true },
    );

    /* ================= ADMIN EMAIL NOTIFICATION ================= */
    const adminEmail = process.env.ADMIN_EMAIL;

    if (adminEmail && process.env.EMAIL_FROM_ADDRESS) {
      try {
        await transporter.sendMail({
          from: `"${req.user.name}" <${process.env.EMAIL_FROM_ADDRESS}>`,
          replyTo: req.user.email,
          to: adminEmail,
          subject: "New Appointment Booked",
          html: `
        <h3>New Appointment</h3>
        <p><b>Customer:</b> ${req.user.name}</p>
        <p><b>Email:</b> ${req.user.email}</p>
        <p><b>Date:</b> ${date}</p>
        <p><b>Time:</b> ${timeSlot}</p>
      `,
        });
      } catch (mailError) {
        console.error("EMAIL ERROR (BOOK APPOINTMENT):", mailError.message);
      }
    }

    /* ================= EMAIL END ================= */

    const updatedUser = await User.findById(req.user._id);

    res.status(201).json({
      appointment,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        profilePhoto: updatedUser.profilePhoto,
        bookingUsed: updatedUser.bookingUsed,
        bookingLimit: updatedUser.bookingLimit,
        planType: updatedUser.planType,
      },
    });
  } catch (error) {
    console.error("BOOK APPOINTMENT ERROR:", error);
    res.status(500).json({
      message: "Server error while booking appointment",
    });
  }
};

/* ================= GET MY APPOINTMENTS ================= */
export const getMyAppointments = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    const appointments = await Appointment.find({
      userId: req.user._id,
    })
      .populate({
        path: "serviceId",
        select: "name price duration",
        strictPopulate: false, // 🔥 MAIN FIX
      })
      .sort({ date: -1, createdAt: -1 });

    res.json(appointments);
  } catch (error) {
    console.error("GET MY APPOINTMENTS ERROR:", error);
    res.status(500).json({
      message: "Failed to load appointments",
      error: error.message,
    });
  }
};

/* ================= GET ALL APPOINTMENTS (ADMIN) ================= */
export const getAllAppointments = async (req, res) => {
  try {
    const { userId, status, search, fromDate, toDate } = req.query;

    const filter = {};

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.userId = userId;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = fromDate;
      if (toDate) filter.date.$lte = toDate;
    }

    const regex = search ? new RegExp(search, "i") : null;

    let appointments = await Appointment.find(filter)
      .populate({
        path: "userId",
        select: "name email",
        match: regex ? { name: regex } : {},
      })
      .populate({
        path: "serviceId",
        select: "name price duration",
        match: regex ? { name: regex } : {},
      })
      // newest first
      .sort({ date: -1, createdAt: -1 });

    // ✅ IMPORTANT: remove non-matching populated docs
    if (search) {
      appointments = appointments.filter(
        (appt) => appt.userId || appt.serviceId,
      );
    }

    res.json(appointments);
  } catch (error) {
    console.error("GET ALL APPOINTMENTS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
};

/* ================= TODAY APPOINTMENT DETAILS (ADMIN) ================= */
export const getTodayAppointments = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .populate({
        path: "userId",
        select: "name email",
        strictPopulate: false,
      })
      .populate({
        path: "serviceId",
        select: "name price duration",
        strictPopulate: false,
      })
      .sort({ date: -1, createdAt: -1 });

    res.json(appointments);
  } catch (error) {
    console.error("TODAY APPOINTMENTS ERROR:", error);
    res.status(500).json({
      message: "Failed to load appointment details",
      error: error.message,
    });
  }
};

/* ================= GET APPOINTMENT DETAILS ================= */
export const getAppointmentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid appointment id" });
    }

    const appointment = await Appointment.findById(id)
      .populate({
        path: "serviceId",
        select: "name price duration",
        strictPopulate: false, // 🔥 MAIN FIX
      })
      .populate({
        path: "userId",
        select: "name email",
        strictPopulate: false, // 🔥 MAIN FIX
      });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json(appointment);
  } catch (error) {
    console.error("GET APPOINTMENT DETAILS ERROR:", error);
    res.status(500).json({
      message: "Failed to load appointment details",
      error: error.message,
    });
  }
};

/* ================= UPDATE STATUS (ADMIN) ================= */
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const { id } = req.params;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid appointment id" });
    }

    const updated = await Appointment.findByIdAndUpdate(
      id,
      {
        status,
        rejectionReason: status === "rejected" ? rejectionReason || "" : "",
      },
      { new: true },
    )
      .populate({
        path: "userId",
        select: "name email",
        strictPopulate: false,
      })
      .populate({
        path: "serviceId",
        select: "name",
        strictPopulate: false,
      });

    if (!updated) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    /* ================= EMAIL NOTIFICATION ================= */
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: updated.userId.email,
      subject:
        status === "approved"
          ? "Appointment Approved ✅"
          : "Appointment Rejected ❌",
      html: `
        <p>Hello ${updated.userId.name},</p>
        <p>Your appointment for <b>${updated.serviceId.name}</b> on 
        <b>${updated.date}</b> at <b>${updated.timeSlot}</b> has been 
        <b>${status.toUpperCase()}</b>.</p>
        ${
          status === "rejected"
            ? `<p><b>Reason:</b> ${rejectionReason || "Not specified"}</p>`
            : ""
        }
      `,
    });
    /* ================= EMAIL END ================= */

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update appointment status",
      error: error.message,
    });
  }
};

/* ================= CANCEL APPOINTMENT(USER) ================= */

export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid appointment id" });
    }

    const appointment = await Appointment.findOne({
      _id: id,
      userId: req.user._id, // 🔐 customer can cancel only their own
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({ message: "Already cancelled" });
    }

    appointment.status = "cancelled";
    await appointment.save();

    /* ================= DECREMENT BOOKING COUNT ================= */
    if (req.user.planType === "free" && req.user.bookingUsed > 0) {
      req.user.bookingUsed -= 1;
      await req.user.save();
    }

    /* ================= ADMIN EMAIL (CANCEL) ================= */
    const adminEmail = process.env.ADMIN_EMAIL;

    if (adminEmail && process.env.EMAIL_FROM_ADDRESS) {
      try {
        await transporter.sendMail({
          from: `"${req.user.name}" <${process.env.EMAIL_FROM_ADDRESS}>`,
          replyTo: req.user.email,
          to: adminEmail,
          subject: "Appointment Cancelled ❌",
          html: `
        <p><b>${req.user.name}</b> cancelled an appointment.</p>
        <p>ID: ${appointment._id}</p>
      `,
        });
      } catch (mailError) {
        console.error("EMAIL ERROR (CANCEL):", mailError.message);
      }
    }
    /* ================= EMAIL END ================= */

    res.json({ message: "Appointment cancelled", appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= RESCHEDULE APPOINTMENT (USER) ================= */
export const rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, timeSlot } = req.body;

    if (!date || !timeSlot) {
      return res.status(400).json({
        message: "Date and timeSlot are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid appointment id",
      });
    }

    const appointment = await Appointment.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    // 🔥 Conflict check
    const conflict = await Appointment.findOne({
      serviceId: appointment.serviceId,
      date,
      timeSlot,
      status: { $ne: "rejected" },
    });

    if (conflict) {
      return res.status(400).json({
        message: "Selected slot is already booked",
      });
    }

    appointment.rescheduledFrom = appointment.date;
    appointment.date = date;
    appointment.timeSlot = timeSlot;
    appointment.status = "rescheduled";

    await appointment.save();

    /* ================= ADMIN EMAIL (RESCHEDULE) ================= */
    const adminEmail = process.env.ADMIN_EMAIL;

    if (adminEmail && process.env.EMAIL_FROM_ADDRESS) {
      try {
        await transporter.sendMail({
          from: `"${req.user.name}" <${process.env.EMAIL_FROM_ADDRESS}>`,
          replyTo: req.user.email,
          to: adminEmail,
          subject: "Appointment Rescheduled 🔁",
          html: `
        <p><b>${req.user.name}</b> rescheduled appointment.</p>
        <p>New Date: ${date}</p>
        <p>New Time: ${timeSlot}</p>
      `,
        });
      } catch (mailError) {
        console.error("EMAIL ERROR (RESCHEDULE):", mailError.message);
      }
    }

    /* ================= EMAIL END ================= */

    res.json({
      message: "Appointment rescheduled successfully",
      appointment,
    });
  } catch (error) {
    console.error("RESCHEDULE ERROR:", error);
    res.status(500).json({
      message: "Failed to reschedule appointment",
    });
  }
};
