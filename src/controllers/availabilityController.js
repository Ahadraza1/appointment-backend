import Availability from "../models/Availability.js";
import Service from "../models/Service.js";
import generateSlots from "../utils/generateSlots.js";

/* ---------------- SET / UPDATE AVAILABILITY (ADMIN) ---------------- */
export const setAvailability = async (req, res) => {
  try {
    const data = req.body;

    let availability = await Availability.findOne();

    if (availability) {
      availability = await Availability.findByIdAndUpdate(
        availability._id,
        data,
        { new: true }
      );
    } else {
      availability = await Availability.create(data);
    }

    res.json(availability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------- GET AVAILABILITY ---------------- */
export const getAvailability = async (req, res) => {
  try {
    const availability = await Availability.findOne();
    res.json(availability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------- GET TIME SLOTS ---------------- */
export const getTimeSlots = async (req, res) => {
  try {
    const { serviceId, date } = req.query;

    const availability = await Availability.findOne();
    if (!availability) {
      return res.status(400).json({ message: "Availability not set" });
    }

    // Holiday check
    if (availability.holidays.includes(date)) {
      return res.json([]);
    }

    // Day check
    const day = new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
    });

    if (!availability.workingDays.includes(day)) {
      return res.json([]);
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const slots = generateSlots(
      availability.startTime,
      availability.endTime,
      service.duration,
      availability.breaks
    );

    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
