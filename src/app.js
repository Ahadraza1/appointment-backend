import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/AdminRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static folders
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://appointment-frontend-livid-xi.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// // IMPORTANT for preflight
// app.options("/*", cors());
 // ✅ Node 24 safe preflight handler
// app.use((req, res, next) => {
//   if (req.method === "OPTIONS") {
//     return res.sendStatus(204);
//   }
//   next();
// });

app.use(express.json()); // parse JSON body
app.use(express.urlencoded({ extended: true }));

// Root health check route
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Appointment Backend is running 🚀",
  });
});

/* ---------------- ROUTES ---------------- */
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/admin/appointments", appointmentRoutes);

/* ---------------- USER ROUTES ---------------- */
app.use("/api/users", userRoutes);

/* ---------------- ADMIN ROUTES ---------------- */
app.use("/api/admin", adminRoutes);

/* ---------------- PAYMENT & SUBSCRIPTION ROUTES ---------------- */
app.use("/api/payment", paymentRoutes);
app.use("/api/subscription", subscriptionRoutes);

/* ---------------- CONTACT ROUTES ---------------- */
app.use("/api", contactRoutes);

/* ---------------- ERROR HANDLING ---------------- */
app.use(notFound);
app.use(errorHandler);

export default app;
