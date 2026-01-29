// import dotenv from "dotenv";
// dotenv.config(); // ✅ FORCE env load HERE

// import nodemailer from "nodemailer";

// const EMAIL_USER = process.env.EMAIL_USER;
// const EMAIL_PASS = process.env.EMAIL_PASS;
// const ADMIN_EMAIL = process.env.ADMIN_EMAIL; // ✅ admin email

// // 🔴 HARD FAIL if env is missing (no silent crash)
// if (!EMAIL_USER || !EMAIL_PASS) {
//   console.error("❌ EMAIL ENV NOT LOADED");
//   console.error("EMAIL_USER:", EMAIL_USER);
//   console.error("EMAIL_PASS exists:", !!EMAIL_PASS);
//   throw new Error("Email credentials missing in environment variables");
// }

// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 587,
//   secure: false,
//   auth: {
//     user: EMAIL_USER,
//     pass: EMAIL_PASS,
//   },
// });

// transporter.verify((err, success) => {
//   if (err) {
//     console.error("❌ SMTP VERIFY FAILED:", err.message);
//   } else {
//     console.log("✅ SMTP READY – Emails can be sent");
//   }
// });

// /* ================================
//    📧 COMMON SEND MAIL FUNCTION
// ================================ */
// export const sendEmail = async ({ to, subject, html }) => {
//   try {
//     await transporter.sendMail({
//       from: `"Appointment System" <${EMAIL_USER}>`,
//       to,
//       subject,
//       html,
//     });
//     console.log("✅ Email sent to:", to);
//   } catch (error) {
//     console.error("❌ Email send failed:", error.message);
//   }
// };

// /* ================================
//    🔔 ADMIN EMAILS
// ================================ */
// export const sendAdminNotification = async (type, data) => {
//   if (!ADMIN_EMAIL) return;

//   let subject = "";
//   let html = "";

//   if (type === "BOOKING") {
//     subject = "📌 New Booking Created";
//     html = `<p>New booking by <b>${data.name}</b><br/>Date: ${data.date}<br/>Time: ${data.time}</p>`;
//   }

//   if (type === "CANCEL") {
//     subject = "❌ Booking Cancelled";
//     html = `<p>Booking cancelled by <b>${data.name}</b><br/>Date: ${data.date}</p>`;
//   }

//   if (type === "RESCHEDULE") {
//     subject = "🔄 Booking Rescheduled";
//     html = `<p>Booking rescheduled by <b>${data.name}</b><br/>New Date: ${data.date}<br/>Time: ${data.time}</p>`;
//   }

//   if (!subject) return;

//   await sendEmail({
//     to: ADMIN_EMAIL,
//     subject,
//     html,
//   });
// };

// /* ================================
//    👤 CUSTOMER EMAILS
// ================================ */
// export const sendCustomerStatusEmail = async (email, status, data) => {
//   let subject = "";
//   let html = "";

//   if (status === "APPROVED") {
//     subject = "✅ Appointment Approved";
//     html = `<p>Your appointment is <b>approved</b>.<br/>Date: ${data.date}<br/>Time: ${data.time}</p>`;
//   }

//   if (status === "REJECTED") {
//     subject = "❌ Appointment Rejected";
//     html = `<p>Sorry, your appointment has been <b>rejected</b>.</p>`;
//   }

//   if (!subject) return;

//   await sendEmail({
//     to: email,
//     subject,
//     html,
//   });
// };



// export default transporter;
