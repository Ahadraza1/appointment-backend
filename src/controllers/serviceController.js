import mongoose from "mongoose";
import Service from "../models/Service.js";

/* ================= CREATE SERVICE (ADMIN) ================= */
export const createService = async (req, res) => {
  try {
    const { name, description, duration, price, status } = req.body;

    if (!name || !duration || !price) {
      return res.status(400).json({
        message: "Name, duration and price are required",
      });
    }

    if (duration <= 0 || price <= 0) {
      return res.status(400).json({
        message: "Duration and price must be greater than 0",
      });
    }

    const service = await Service.create({
      name,
      description: description || "",
      duration,
      price,
      status: status || "active",
    });

    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= BULK CREATE SERVICES (ADMIN) ================= */
export const bulkCreateServices = async (req, res) => {
  try {
    const services = req.body;

    if (!Array.isArray(services) || services.length === 0) {
      return res
        .status(400)
        .json({ message: "Array of services is required" });
    }

    const prepared = services.map((s, index) => {
      if (!s.name || !s.duration || !s.price) {
        throw new Error(
          `Invalid service at index ${index}`
        );
      }

      return {
        name: s.name,
        description: s.description || "",
        duration: s.duration,
        price: s.price,
        status: s.status || "active",
      };
    });

    const created = await Service.insertMany(prepared);

    res.status(201).json({
      count: created.length,
      services: created,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* ================= GET SERVICES (PUBLIC + PAGINATION) ================= */
export const getServices = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // ✅ DEFAULT: only active services for customers
    const query = { status: "active" };

    // ✅ Admin can still filter manually
    if (req.query.status && req.query.status !== "all") {
      query.status = req.query.status;
    }

    const [services, total] = await Promise.all([
      Service.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Service.countDocuments(query),
    ]);

    res.status(200).json({
      services,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ================= UPDATE SERVICE (ADMIN) ================= */
export const updateService = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid service id" });
    }

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    service.name = req.body.name ?? service.name;
    service.description =
      req.body.description ?? service.description;
    service.duration = req.body.duration ?? service.duration;
    service.price = req.body.price ?? service.price;
    service.status = req.body.status ?? service.status;

    const updated = await service.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= DELETE SERVICE (ADMIN) ================= */
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid service id" });
    }

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    await service.deleteOne();
    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= TOGGLE SERVICE STATUS (ADMIN) ================= */
export const toggleServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid service id" });
    }

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    service.status =
      service.status === "active" ? "inactive" : "active";

    await service.save();
    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
