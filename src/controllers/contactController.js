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

    // 🔥 2. SEND RESPONSE IMMEDIATELY (VERY IMPORTANT)
    res.status(200).json({
      success: true,
      message: "Message received successfully",
    });

    /* ===============================
       🔥 BACKGROUND EMAIL TASKS
       (DO NOT AWAIT)
    ================================ */

    // 📩 Admin email
    transporter
      .sendMail({
        from: `"Appointment System" <${process.env.EMAIL_USER}>`,
        to: settings.contactEmail,
        replyTo: email,
        subject: `New Contact Message from ${name}`,
        html: `
          <h3>New Contact Message</h3>
          <p><b>Name:</b> ${name}</p>
          <p><b>Email:</b> ${email}</p>
          <p><b>Message:</b></p>
          <p>${message}</p>
        `,
      })
      .catch((err) => {
        console.error("❌ ADMIN CONTACT MAIL ERROR:", err);
      });

    // 📩 Customer auto-reply
    transporter
      .sendMail({
        from: `"Appointment System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "We received your message",
        html: `
          <p>Hello ${name},</p>
          <p>Thank you for contacting us. We have received your message and will get back to you shortly.</p>
          <br/>
          <p><b>Your message:</b></p>
          <p>${message}</p>
          <br/>
          <p>Regards,<br/>Appointment System Team</p>
        `,
      })
      .catch((err) => {
        console.error("❌ CUSTOMER AUTO-REPLY ERROR:", err);
      });
  } catch (error) {
    console.error("❌ CONTACT CONTROLLER ERROR:", error);

    // ⚠️ safety fallback (rare)
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to process contact request",
      });
    }
  }
};
