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

    const service = await Service.findById(serviceId);
    if (!service || service.status !== "active") {
      return res.status(400).json({ message: "Service not available" });
    }

    const user = await User.findById(req.user._id);

    if (user.subscriptionStatus === "expired") {
      return res.status(403).json({
        message: "Your plan has expired. Please upgrade your plan to continue.",
        redirect: "pricing",
      });
    }

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

    const availability = await Availability.findOne();
    if (!availability || !availability.bookingOpen) {
      return res.status(400).json({ message: "Booking is currently closed" });
    }

    const rules = service.availabilityEnabled ? service : availability;

    const bookingDate = new Date(date);
    const dayName = bookingDate.toLocaleDateString("en-US", {
      weekday: "short",
    });

    if (rules.workingDays?.length && !rules.workingDays.includes(dayName)) {
      return res
        .status(400)
        .json({ message: "Bookings are closed on this day" });
    }

    if (rules.holidays?.includes(date)) {
      return res
        .status(400)
        .json({ message: "Bookings are closed on holidays" });
    }

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

    const appointment = await Appointment.create({
      companyId: service.companyId, // ✅ ADD THIS
      userId: req.user._id,
      serviceId,
      date,
      timeSlot,
      notes,
      status: "pending",
    });

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { bookingUsed: 1 },
    });

    /* ✅ RESPOND IMMEDIATELY (FIX) */
    res.status(201).json({ appointment });

    /* ================= EMAILS (BACKGROUND – NON BLOCKING) ================= */
    setImmediate(() => {
      try {
        const adminEmail = process.env.ADMIN_EMAIL;

        if (adminEmail && process.env.EMAIL_USER) {
          transporter.sendMail({
            from: `"Appointment System" <${process.env.EMAIL_USER}>`,
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
        }

        if (req.user.email && process.env.EMAIL_USER) {
          transporter.sendMail({
            from: `"Appointment System" <${process.env.EMAIL_USER}>`,
            to: req.user.email,
            subject: "📅 Appointment Booked Successfully",
            html: `
              <p>Hello ${req.user.name},</p>
              <p>Your appointment has been <b>successfully booked</b>.</p>
              <p><b>Date:</b> ${date}</p>
              <p><b>Time:</b> ${timeSlot}</p>
              <p>Status: <b>Pending approval</b></p>
            `,
          });
        }
      } catch (e) {
        console.error("EMAIL BACKGROUND ERROR:", e.message);
      }
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

    // 🔒 ADMIN → company isolation at DB level
    if (req.user.role === "admin") {
      const services = await Service.find(
        { companyId: req.user.companyId },
        "_id",
      );
      filter.serviceId = { $in: services.map((s) => s._id) };
    }

    let appointments = await Appointment.find(filter)
      .populate({
        path: "userId",
        select: "name email",
        match: regex ? { name: regex } : {},
      })
      .populate({
        path: "serviceId",
        select: "name price duration companyId",
        match: regex ? { name: regex } : {},
      })
      .sort({ date: -1, createdAt: -1 });

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

export const getTodayAppointments = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const filter = {
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    };

    // 🔒 ADMIN → company isolation at DB level
    if (req.user.role === "admin") {
      const services = await Service.find(
        { companyId: req.user.companyId },
        "_id",
      );
      filter.serviceId = { $in: services.map((s) => s._id) };
    }

    const appointments = await Appointment.find(filter)
      .populate({
        path: "userId",
        select: "name email",
        strictPopulate: false,
      })
      .populate({
        path: "serviceId",
        select: "name price duration companyId",
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
        select: "name price duration companyId",
        strictPopulate: false,
      })
      .populate({
        path: "userId",
        select: "name email",
        strictPopulate: false,
      });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    /* 🔒 COMPANY ISOLATION (ADMIN ONLY) */
    if (
      req.user.role === "admin" &&
      String(appointment.serviceId?.companyId) !== String(req.user.companyId)
    ) {
      return res.status(403).json({ message: "Access denied" });
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

    const appointment = await Appointment.findById(id)
      .populate("userId", "name email")
      .populate("serviceId", "name companyId");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // 🔒 Admin company isolation
    if (
      req.user.role === "admin" &&
      String(appointment.companyId) !== String(req.user.companyId)
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    appointment.status = status;
    appointment.rejectionReason =
      status === "rejected" ? rejectionReason || "" : "";

    await appointment.save();

    /* ================= EMAIL (SAFE) ================= */
    try {
      if (appointment.userId?.email && process.env.EMAIL_USER) {
        transporter.sendMail({
          from: `"Appointment System" <${process.env.EMAIL_USER}>`,
          to: appointment.userId.email,
          subject:
            status === "approved"
              ? "Appointment Approved ✅"
              : "Appointment Rejected ❌",
          html: `
            <p>Hello ${appointment.userId.name},</p>
            <p>Your appointment for <b>${appointment.serviceId.name}</b>
            on <b>${appointment.date}</b> at <b>${appointment.timeSlot}</b>
            has been <b>${status.toUpperCase()}</b>.</p>
            ${
              status === "rejected"
                ? `<p><b>Reason:</b> ${rejectionReason || "Not specified"}</p>`
                : ""
            }
          `,
        });
      }
    } catch (e) {
      console.error("EMAIL ERROR:", e.message);
    }

    res.json(appointment);
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

    if (adminEmail && process.env.EMAIL_USER) {
      try {
        transporter.sendMail({
          from: `"${req.user.name}" <${process.env.EMAIL_USER}>`,
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

    if (adminEmail && process.env.EMAIL_USER) {
      try {
        transporter.sendMail({
          from: `"${req.user.name}" <${process.env.EMAIL_USER}>`,
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
