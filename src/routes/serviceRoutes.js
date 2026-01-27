import express from "express";
import {
  createService,
  getServices,
  bulkCreateServices,
  updateService,
  deleteService,
  toggleServiceStatus,
} from "../controllers/serviceController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import { validateFields } from "../middlewares/validateMiddleware.js";

const router = express.Router();

/* ================= PUBLIC ================= */
// GET /api/services
router.get("/", getServices);

/* ================= ADMIN ================= */
// POST /api/services
router.post(
  "/",
  protect,
  adminOnly,
  validateFields(["name", "duration", "price"]),
  createService
);

// POST /api/services/bulk
router.post(
  "/bulk",
  protect,
  adminOnly,
  bulkCreateServices
);

// PUT /api/services/:id
router.put("/:id", protect, adminOnly, updateService);

// DELETE /api/services/:id
router.delete("/:id", protect, adminOnly, deleteService);


router.patch(
  "/:id/toggle",
  protect,
  adminOnly,
  toggleServiceStatus
);


export default router;
