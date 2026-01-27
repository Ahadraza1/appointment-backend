import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number,
      required: true, // minutes
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    /* ================= SERVICE-WISE AVAILABILITY ================= */

    availabilityEnabled: {
      type: Boolean,
      default: false, // false = use global availability
    },

    workingDays: {
      type: [String], // ["Monday", "Tuesday"]
      default: [],
    },

    startTime: {
      type: String, // "09:00"
    },

    endTime: {
      type: String, // "18:00"
    },

    breaks: [
      {
        start: String, // "13:00"
        end: String,   // "14:00"
      },
    ],

    holidays: {
      type: [String], // ["2026-01-26"]
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Service", serviceSchema);
