import AdminSettings from "../models/AdminSettings.js";

export const getSettings = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? { companyId: req.user.companyId }
        : {};

    let settings = await AdminSettings.findOne(filter);

    if (!settings) {
      settings = await AdminSettings.create(
        req.user.role === "admin"
          ? { companyId: req.user.companyId }
          : {}
      );
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch settings" });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? { companyId: req.user.companyId }
        : {};

    const update =
      req.user.role === "admin"
        ? { ...req.body, companyId: req.user.companyId }
        : req.body;

    const settings = await AdminSettings.findOneAndUpdate(
      filter,
      update,
      { new: true, upsert: true }
    );

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Failed to update settings" });
  }
};
