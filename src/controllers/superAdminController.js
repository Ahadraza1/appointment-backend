import Company from "../models/Company.js";
import User from "../models/user.js";
import Service from "../models/Service.js";
import Appointment from "../models/Appointment.js";

/* ================= CREATE COMPANY + ADMIN ================= */
export const createCompanyWithAdmin = async (req, res) => {
  try {
    const {
      companyName,
      companyEmail,
      adminName,
      adminEmail,
      adminPassword,
    } = req.body;

    if (
      !companyName ||
      !companyEmail ||
      !adminName ||
      !adminEmail ||
      !adminPassword
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const adminExists = await User.findOne({ email: adminEmail });
    if (adminExists) {
      return res.status(400).json({
        message: "Admin already exists with this email",
      });
    }

    const company = await Company.create({
      name: companyName,
      email: companyEmail,
    });

    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      companyId: company._id,
    });

    res.status(201).json({
      success: true,
      message: "Company and Admin created successfully",
      company: {
        id: company._id,
        name: company.name,
      },
      admin: {
        id: admin._id,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Create company error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET ALL COMPANIES (SUPER ADMIN) ================= */
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: companies.length,
      companies,
    });
  } catch (error) {
    console.error("Get companies error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ================= TOGGLE COMPANY STATUS (SUPER ADMIN) ================= */
export const toggleCompanyStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Company id is required" });
    }

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    company.status =
      company.status === "active" ? "inactive" : "active";

    await company.save();

    res.status(200).json({
      success: true,
      message: `Company ${company.status} successfully`,
      company,
    });
  } catch (error) {
    console.error("Toggle company status error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET COMPANY ADMINS (SUPER ADMIN) ================= */
export const getCompanyAdmins = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({ message: "Company id is required" });
    }

    const admins = await User.find({
      role: "admin",
      companyId,
    }).select("name email createdAt");

    res.status(200).json({
      success: true,
      count: admins.length,
      admins,
    });
  } catch (error) {
    console.error("Get company admins error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET COMPANY STATS (SUPER ADMIN) ================= */
export const getCompanyStats = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({ message: "Company id is required" });
    }

    const [adminCount, serviceCount, appointmentCount] = await Promise.all([
      User.countDocuments({ role: "admin", companyId }),
      Service.countDocuments({ companyId }),
      Appointment.countDocuments({ companyId }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        admins: adminCount,
        services: serviceCount,
        appointments: appointmentCount,
      },
    });
  } catch (error) {
    console.error("Get company stats error:", error);
    res.status(500).json({ message: error.message });
  }
};
