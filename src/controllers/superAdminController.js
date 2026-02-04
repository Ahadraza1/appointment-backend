import Company from "../models/Company.js";
import User from "../models/user.js";

/* ================= CREATE COMPANY + ADMIN ================= */
export const createCompanyWithAdmin = async (req, res) => {
  try {
    const { companyName, companyEmail, adminName, adminEmail, adminPassword } =
      req.body;

    if (
      !companyName ||
      !companyEmail ||
      !adminName ||
      !adminEmail ||
      !adminPassword
    ) {
      return res
        .status(400)
        .json({ message: "All fields are required" });
    }

    // Check if admin already exists
    const adminExists = await User.findOne({ email: adminEmail });
    if (adminExists) {
      return res
        .status(400)
        .json({ message: "Admin already exists with this email" });
    }

    // Create company
    const company = await Company.create({
      name: companyName,
      email: companyEmail,
    });

    // Create admin (company owner)
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword, // hashed by model
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
