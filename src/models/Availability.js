import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    workingDays: {
      type: [String], // ["Monday", "Tuesday"]
      required: true
    },
    startTime: {
      type: String, // "09:00"
      required: true
    },
    endTime: {
      type: String, // "18:00"
      required: true
    },
    breaks: [
      {
        start: String,
        end: String
      }
    ],
    holidays: {
      type: [String] // ["2026-01-26"]
    },

    // ✅ NEW (IMPORTANT)
    bookingOpen: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const Availability = mongoose.model("Availability", availabilitySchema);
export default Availability;
