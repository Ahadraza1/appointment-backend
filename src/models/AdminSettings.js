import mongoose from "mongoose";

const adminSettingsSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      default: "",
    },
    businessAddress: {
      type: String,
      default: "",
    },
    contactEmail: {
      type: String,
      default: "",
    },
    contactPhone: {
      type: String,
      default: "",
    },
    notifications: {
      emailOnBooking: {
        type: Boolean,
        default: true,
      },
      emailOnApproval: {
        type: Boolean,
        default: true,
      },
      emailOnCancellation: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

const AdminSettings = mongoose.model(
  "AdminSettings",
  adminSettingsSchema
);

export default AdminSettings;
