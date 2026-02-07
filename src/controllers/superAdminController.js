import Company from "../models/Company.js";
import User from "../models/user.js";
import Service from "../models/Service.js";
import Appointment from "../models/Appointment.js";

export const createCompanyWithAdmin = async (req, res) => {
  try {
    const {
      companyName,
      companyEmail,
      adminName,
      adminEmail,
      adminPassword,
      adminPhone, // ✅ NEW
    } = req.body;

    // 1️⃣ Required fields check
    if (
      !companyName ||
      !companyEmail ||
      !adminName ||
      !adminEmail ||
      !adminPassword ||
      !adminPhone
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // 2️⃣ Duplicate admin check
    const adminExists = await User.findOne({ email: adminEmail });
    if (adminExists) {
      return res.status(400).json({
        message: "Admin already exists with this email",
      });
    }

    // 3️⃣ Duplicate company check
    const companyExists = await Company.findOne({ email: companyEmail });
    if (companyExists) {
      return res.status(400).json({
        message: "Company already exists with this email",
      });
    }

    // 4️⃣ Create company
    const company = await Company.create({
      name: companyName,
      email: companyEmail,
    });

    // 5️⃣ Create admin (✅ REAL PHONE USED)
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      phone: adminPhone, // ✅ FIXED
      password: adminPassword,
      role: "admin",
      companyId: company._id,
    });

    return res.status(201).json({
      success: true,
      message: "Company and Admin created successfully",
      company: {
        id: company._id,
        name: company.name,
      },
      admin: {
        id: admin._id,
        email: admin.email,
        phone: admin.phone,
      },
    });
  } catch (error) {
    console.error("Create company error:", error.message);
    return res.status(500).json({
      message: error.message || "Internal server error while creating company",
    });
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

    company.status = company.status === "active" ? "inactive" : "active";

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

/* ================= GET COMPANY SERVICES (SUPER ADMIN) ================= */
export const getCompanyServices = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({
        message: "Company id is required",
      });
    }

    const services = await Service.find({ companyId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    console.error("Get company services error:", error.message);
    return res.status(500).json({
      message: "Failed to fetch company services",
    });
  }
};

/* ================= GET ALL COMPANY ADMINS (SUPER ADMIN) ================= */
export const getAllCompanyAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" })
      .populate("companyId", "name email")
      .select("name email createdAt companyId")
      .sort({ createdAt: -1 });

    const formattedData = admins.map((admin) => ({
      adminId: admin._id,
      adminName: admin.name,
      adminEmail: admin.email,
      createdAt: admin.createdAt,
      company: admin.companyId
        ? {
            companyId: admin.companyId._id,
            companyName: admin.companyId.name,
            companyEmail: admin.companyId.email,
          }
        : null,
    }));

    res.status(200).json({
      success: true,
      count: formattedData.length,
      admins: formattedData,
    });
  } catch (error) {
    console.error("Get all company admins error:", error);
    res.status(500).json({
      message: "Failed to fetch company admins",
    });
  }
};

/* ================= DELETE COMPANY (SUPER ADMIN) ================= */
export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Company id is required",
      });
    }

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    // 1️⃣ Delete company admins
    await User.deleteMany({
      role: "admin",
      companyId: id,
    });

    // 2️⃣ Delete company services
    await Service.deleteMany({ companyId: id });

    // 3️⃣ Delete company appointments
    await Appointment.deleteMany({ companyId: id });

    // 4️⃣ Delete company
    await Company.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Company and related data deleted successfully",
    });
  } catch (error) {
    console.error("Delete company error:", error);
    return res.status(500).json({
      message: "Failed to delete company",
    });
  }
};
