import Company from "../models/Company.js";
import User from "../models/user.js";
import Service from "../models/Service.js";
import Appointment from "../models/Appointment.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";


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

    const services = await Service.find({
      companyId: new mongoose.Types.ObjectId(companyId),
    }).sort({ createdAt: -1 });

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

/* ================= GET COMPANY CUSTOMERS (SUPER ADMIN) ================= */
export const getCompanyCustomers = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({
        message: "Company id is required",
      });
    }

    // 1️⃣ Get appointments of this company
    const appointments = await Appointment.find({
      companyId: new mongoose.Types.ObjectId(companyId),
    }).select("userId");

    // 2️⃣ Extract unique customer IDs
    const customerIds = [
      ...new Set(appointments.map((a) => a.userId.toString())),
    ];

    if (customerIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        customers: [],
      });
    }

    // 3️⃣ Fetch customer details
    const customers = await User.find({
      _id: { $in: customerIds },
      role: "customer",
    })
      .select("name email phone createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("Get company customers error:", error.message);
    return res.status(500).json({
      message: "Failed to fetch company customers",
    });
  }
};

/* ================= GET CUSTOMER APPOINTMENTS (SUPER ADMIN) ================= */
export const getCompanyCustomerAppointments = async (req, res) => {
  try {
    const { companyId, customerId } = req.params;

    if (!companyId || !customerId) {
      return res.status(400).json({
        message: "Company id and customer id are required",
      });
    }

    const appointments = await Appointment.find({
      companyId: new mongoose.Types.ObjectId(companyId),
      userId: new mongoose.Types.ObjectId(customerId),
    })
      .populate("serviceId", "name price duration")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Get customer appointments error:", error.message);
    return res.status(500).json({
      message: "Failed to fetch customer appointments",
    });
  }
};

/* ================= GET SUPERADMIN PROFILE ================= */
export const getSuperAdminProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "name email phone role profilePhoto",
    );

    if (!user || user.role !== "superadmin") {
      return res.status(404).json({
        message: "SuperAdmin not found",
      });
    }

    res.status(200).json({
      success: true,
      profile: user,
    });
  } catch (error) {
    console.error("Get superadmin profile error:", error.message);
    res.status(500).json({
      message: "Failed to fetch profile",
    });
  }
};

/* ================= UPDATE SUPERADMIN PROFILE ================= */
export const updateSuperAdminProfile = async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    const user = await User.findById(req.user._id);

    if (!user || user.role !== "superadmin") {
      return res.status(404).json({
        message: "SuperAdmin not found",
      });
    }

    // ✅ EMAIL UPDATE (with proper uniqueness check)
    if (email && email !== user.email) {
      const emailExists = await User.findOne({
        email,
        _id: { $ne: user._id },
      });

      if (emailExists) {
        return res.status(400).json({
          message: "Email already in use",
        });
      }

      user.email = email;
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();

    // 🔥 IMPORTANT FIX: fetch fresh user from DB
    const updatedUser = await User.findById(user._id).select(
      "name email phone",
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile: {
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
      },
    });
  } catch (error) {
    console.error("Update superadmin profile error:", error.message);
    return res.status(500).json({
      message: "Failed to update profile",
    });
  }
};

/* ================= CHANGE SUPERADMIN PASSWORD ================= */
export const changeSuperAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user || user.role !== "superadmin") {
      return res.status(404).json({
        message: "SuperAdmin not found",
      });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save(); // password hash hook auto chalega

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change superadmin password error:", error.message);
    res.status(500).json({
      message: "Failed to update password",
    });
  }
};

/* ================= UPDATE SUPERADMIN PROFILE PHOTO ================= */
export const updateSuperAdminProfilePhoto = async (req, res) => {
  try {
    // multer ke through file aayegi
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user || user.role !== "superadmin") {
      return res.status(404).json({
        message: "SuperAdmin not found",
      });
    }

    // ✅ save relative path
    user.profilePhoto = `/uploads/${req.file.filename}`;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully",
      profilePhoto: user.profilePhoto,
    });
  } catch (error) {
    console.error("Update profile photo error:", error.message);
    return res.status(500).json({
      message: "Failed to update profile photo",
    });
  }
};

/* ================= REMOVE SUPERADMIN PROFILE PHOTO ================= */
export const removeSuperAdminProfilePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user || user.role !== "superadmin") {
      return res.status(404).json({
        message: "SuperAdmin not found",
      });
    }

    // ✅ remove photo reference
    user.profilePhoto = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile photo removed successfully",
      profilePhoto: null,
    });
  } catch (error) {
    console.error("Remove profile photo error:", error.message);
    return res.status(500).json({
      message: "Failed to remove profile photo",
    });
  }
};

/* ================= IMPERSONATE COMPANY ADMIN (SUPER ADMIN ONLY) ================= */
export const impersonateCompanyAdmin = async (req, res) => {
  try {
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({
        message: "Company id is required",
      });
    }

    // ✅ Find company
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    // ✅ Find company admin
    const admin = await User.findOne({
      role: "admin",
      companyId: companyId,
    });

    if (!admin) {
      return res.status(404).json({
        message: "Company admin not found",
      });
    }

    // ✅ Generate impersonation token
    const token = jwt.sign(
      {
        id: admin._id,
        role: "admin",
        companyId: companyId,
        impersonatedBy: "superadmin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    return res.status(200).json({
      success: true,
      token,
      company: {
        id: company._id,
        name: company.name,
      },
    });
  } catch (error) {
    console.error("Impersonate company admin error:", error.message);
    return res.status(500).json({
      message: "Failed to impersonate company admin",
    });
  }
};
