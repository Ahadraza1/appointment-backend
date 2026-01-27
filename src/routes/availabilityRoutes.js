import express from "express";
import {
  setAvailability,
  getAvailability,
  getTimeSlots
} from "../controllers/availabilityController.js";

import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Admin
router.post("/", protect, adminOnly, setAvailability);

// Public
router.get("/", getAvailability);
router.get("/slots", getTimeSlots);

export default router;
