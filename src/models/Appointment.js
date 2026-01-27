import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled", "rescheduled"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    rescheduledFrom: {
      type: Date,
    },
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
