import transporter from "../config/mail.config.js";
import AdminSettings from "../models/AdminSettings.js";

export const sendContactMail = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // 🔥 1. Get admin settings (company email)
    const settings = await AdminSettings.findOne();

    if (!settings || !settings.contactEmail) {
      return res.status(400).json({
        success: false,
        message: "Company contact email is not configured",
      });
    }

    // 🔥 2. Send email to ADMIN PANEL contact email
    await transporter.sendMail({
      from: `"Appointment System" <${process.env.EMAIL_USER}>`,
      to: settings.contactEmail, // ✅ ADMIN PANEL EMAIL
      replyTo: email, // company reply → customer
      subject: `New Contact Message from ${name}`,
      html: `
        <h3>New Contact Message</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b></p>
        <p>${message}</p>
      `,
    });

    res.status(200).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("❌ CONTACT EMAIL ERROR FULL:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to send message",
    });
  }
};
