// import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   service: 'gmail',
//   auth: {
//     user: "abinashpatri5@gmail.com",
//     pass: "hdvheaoucxksgipo",
//   },
// });

// export async function mail(to = [],subject = "",message = "") {
//   try {
//     const info = await transporter.sendMail({
//       from: `"Agstamp" <abinashpatri5@gmail.com>`,
//       to: `${to.join(",")}`,
//       subject: subject,
//       html: message,
//     });
//     return info;
//   } catch (error) {
//     return error
//   }
// }


// import nodemailer from "nodemailer";
// const transporter = nodemailer.createTransport({
//   host: "smtp-relay.brevo.com",
//   port: 587, // use 465 for SSL if needed
//   auth: {
//     user: "abinashpatri5@gmail.com", // your Brevo login email
//     pass: "OV9MRqLGPB13I7TW",          // generate from Brevo SMTP settings
//   },
// });

// export async function mail(to = [], subject = "", message = "") {
//   try {
//     const info = await transporter.sendMail({
//       from: `"Agstamp" <abinashpatri5@gmail.com>`, // change to match auth user
//       to: `${to.join(",")}`,
//       subject: subject,
//       html: message,
//     });
//     return info;
//   } catch (error) {
//     return error;
//   }
// }

// import nodemailer from "nodemailer";
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST, 
//   port: process.env.SMTP_PORT,
//   secure: process.env.SMTP_SECURE , // true if using 465
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// export async function mail(to = [], subject = "", message = "") {
//   try {
//     const info = await transporter.sendMail({
//       from: `"Agstamp" <${process.env.SMTP_USER}>`, 
//       to: to.join(","),
//       subject,
//       html: message,
//     });
//     return info;
//   } catch (error) {
//     console.error("Mail sending error:", error);
//     throw error;
//   }
// }

// import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST, 
//   port: parseInt(process.env.SMTP_PORT), // Convert to number
//   secure: process.env.SMTP_SECURE === 'true', // Convert to boolean
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// export async function mail(to = [], subject = "", message = "") {
//   try {
//     const info = await transporter.sendMail({
//       from: `"Agstamp" <${process.env.SMTP_USER}>`, 
//       to: to.join(","),
//       subject,
//       html: message,
//     });
//     console.log("Email sent successfully:", info.messageId);
//     return info;
//   } catch (error) {
//     console.error("Mail sending error:", error);
//     throw error;
//   }
// }

import nodemailer from "nodemailer";
import dotenv from 'dotenv';
dotenv.config({ path: 'Config/config.env' });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ionos.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  debug: true, // Enable debug output
  logger: true // Log information to console
});

export async function mail(to = [], subject = "", message = "") {
  try {
    console.log('📧 Attempting to send email...');
    console.log('SMTP Host:', process.env.SMTP_HOST);
    console.log('SMTP Port:', process.env.SMTP_PORT);
    console.log('SMTP User:', process.env.SMTP_USER);
    
    const info = await transporter.sendMail({
      from: `"Agstamp" <${process.env.SMTP_USER}>`, 
      to: to.join(","),
      subject,
      html: message,
    });
    
    console.log("✅ Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Mail sending error:", error);
    throw error;
  }
}