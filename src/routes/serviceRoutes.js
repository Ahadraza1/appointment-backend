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
// GET /api/admin/services
router.get(
  "/admin",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const services = await Service.find({
        companyId: req.user.companyId,
      }).sort({ createdAt: -1 });

      res.status(200).json(services);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

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
