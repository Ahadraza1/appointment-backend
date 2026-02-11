import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    phone: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["customer", "admin", "superadmin"],
      default: "customer",
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },

    profilePhoto: {
      type: String,
    },

    /* ================= SUBSCRIPTION ================= */

    planType: {
      type: String,
      enum: ["free", "monthly", "yearly"],
      default: "free",
    },

    subscriptionStatus: {
      type: String,
      enum: ["active", "expired"],
      default: "active",
    },

    subscriptionStartDate: {
      type: Date,
      default: null,
    },

    subscriptionEndDate: {
      type: Date,
      default: null,
    },

    /* ================= BOOKING LIMIT ================= */

    bookingLimit: {
      type: Number,
      default: 10, // free plan default
    },

    bookingUsed: {
      type: Number,
      default: 0,
    },

    freePlanUsed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

/* ================= PASSWORD HASH ================= */

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model("User", userSchema);

export default User;
