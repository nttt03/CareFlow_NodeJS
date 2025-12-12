import "dotenv/config.js"
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { Buffer } from "buffer";
import { Resend } from "resend";

// const resend = new Resend(process.env.RESEND_API_KEY);

// Khởi tạo OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Khởi tạo Gmail API
const gmail = google.gmail({ version: "v1", auth: oauth2Client });

// === Tạo email raw (có hoặc không có attachment) ===
const createEmailRaw = ({ to, subject, html, attachments = [] }) => {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;

  const boundary = "careflow_boundary_" + Date.now();

  let messageParts = [
    `From: "CareFlow" <${process.env.EMAIL_APP}>`,
    `To: ${to}`,
    "Content-Type: multipart/mixed; boundary=\"" + boundary + "\"",
    "MIME-Version: 1.0",
    `Subject: ${utf8Subject}`,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=utf-8",
    "MIME-Version: 1.0",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(html).toString("base64"),
  ];

  // Thêm attachment nếu có
  attachments.forEach((att) => {
    messageParts = messageParts.concat([
      "",
      `--${boundary}`,
      `Content-Type: ${att.mimeType}; name="${att.filename}"`,
      "MIME-Version: 1.0",
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${att.filename}"`,
      "",
      att.content, // đã là base64 string
    ]);
  });

  messageParts.push("", `--${boundary}--`, "");

  const message = messageParts.join("\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const sendGmailMessage = async (raw) => {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
};

// Email THÔNG BÁO ĐẶT LỊCH
const sendSimpleEmail = async (dataSend) => {
  try {
    const raw = createEmailRaw({
      to: dataSend.receiverEmail,
      subject: "Thông tin đặt lịch khám bệnh",
      html: getBodyHTMLEmail(dataSend),
    });

    await sendGmailMessage(raw);
    console.log("Email đặt lịch đã gửi thành công!");
  } catch (error) {
    console.error("Lỗi gửi email đặt lịch:", error.message);
    throw error;
  }
};

// 1. GỬI EMAIL CÓ ĐÍNH KÈM (ĐƠN THUỐC PDF/ẢNH)
let sendAttachment = async (dataSend) => {
  try {
    if (!dataSend.email || !dataSend.imgBase64) {
      throw new Error("Missing email or file data");
    }

    // Xử lý base64 → buffer → base64 string (Gmail API cần base64 string)
    const matches = dataSend.imgBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) throw new Error("Invalid base64 format");

    const mimeType = matches[1];
    const base64Data = matches[2];

    let extension = "png";
    if (mimeType.includes("pdf")) extension = "pdf";
    else if (mimeType.includes("jpeg")) extension = "jpg";

    const filename = `don-thuoc-${dataSend.patientId}-${Date.now()}.${extension}`;

    const raw = createEmailRaw({
      to: dataSend.email,
      subject: "Đơn thuốc & Kết quả khám bệnh",
      html: getBodyHTMLEmailRemeDy(dataSend),
      attachments: [
        {
          mimeType,
          filename,
          content: base64Data, // ← Gmail API nhận base64 string, không cần Buffer
        },
      ],
    });

    await sendGmailMessage(raw);
    console.log("Email đơn thuốc (có attachment) đã gửi thành công!");
  } catch (error) {
    console.error("Lỗi gửi email đơn thuốc:", error.message);
    throw error;
  }
};

// 2. GỬI EMAIL NHẮC LỊCH
let sendReminderEmail = async (dataSend) => {
  try {
    const raw = createEmailRaw({
      to: dataSend.receiverEmail,
      subject:
        dataSend.language === "vi"
          ? "Nhắc nhở lịch hẹn khám bệnh"
          : "Appointment Reminder",
      html: getBodyHTMLEmailReminder(dataSend),
    });

    await sendGmailMessage(raw);
    console.log("Email nhắc lịch đã gửi thành công!");
  } catch (error) {
    console.error("Lỗi gửi email nhắc lịch:", error.message);
    throw error;
  }
};

// 3. GỬI EMAIL ĐẶT LẠI MẬT KHẨU
export const sendResetPasswordEmail = async (dataSend) => {
  try {
    const raw = createEmailRaw({
      to: dataSend.receiverEmail,
      subject: "Đặt lại mật khẩu - CareFlow",
      html: getResetPasswordHTML(dataSend),
    });

    await sendGmailMessage(raw);
    console.log("Email đặt lại mật khẩu đã gửi thành công!");
  } catch (error) {
    console.error("Lỗi gửi email reset password:", error.message);
    throw error;
  }
};

// let sendSimpleEmail = async (dataSend) => {
//   let transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     // port: 587,
//     // secure: false, // true for port 465, false for other ports
//     port: 465,
//     secure: true, // SSL
//     auth: {
//       user: process.env.EMAIL_APP,
//       pass: process.env.EMAIL_APP_PASSWORD,
//     },
//   });
//   let info = await transporter.sendMail({
//     from: '"CareFlow.com 🩺" <thanhthao.thptqt@gmail.com>', // sender address
//     to: dataSend.receiverEmail, // list of receivers
//     subject: "Thông tin đặt lịch khám bệnh", // Subject line
//     html: getBodyHTMLEmail(dataSend), // html body
//   });
//   // console.log('dataSend >>>: ', dataSend);
// };

// let sendSimpleEmail = async (dataSend) => {
//   try {
//     const response = await resend.emails.send({
//       from: "CareFlow 🩺 <onboarding@resend.dev>",
//       to: dataSend.receiverEmail,
//       subject: "Thông tin đặt lịch khám bệnh",
//       html: getBodyHTMLEmail(dataSend),
//     });

//     console.log("Email sent successfully:", response);
//     return response;

//   } catch (error) {
//     console.error("Send email error:", error?.message || error);
//     return {
//       errCode: -1,
//       message: "Failed to send email"
//     };
//   }
// };

let getBodyHTMLEmail = (dataSend) => {
  let result = "";
  if (dataSend.language === "vi") {
    result = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2c3e50;">Xin chào ${dataSend.patientName},</h2>
                <p>Cảm ơn bạn đã đặt lịch hẹn khám bệnh tại <strong>CareFlow.com 🩺</strong>.</p>
                <p>Thông tin đặt lịch khám bệnh:</p>
                <p>Thời gian: ${dataSend.time}</p>
                <p>Bác sĩ: ${dataSend.doctorName}</p>
                <p style="font-style: italic;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email. Xin cảm ơn!</p>
                <hr style="border: none; border-top: 1px solid #ddd;">
                <p style="color: #777; font-size: 14px;">Mọi thắc mắc vui lòng liên hệ <strong>CareFlow.com 🩺</strong> qua email hoặc số tổng đài.</p>
                <p>Email: CareFlow@gmail.com</p>
                <p>Số tổng đài: 0132659874</p>
                </div>
        `;
  }
  if (dataSend.language === "en") {
    result = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2c3e50;">Hello ${dataSend.patientName},</h2>
                <p>Thank you for booking your medical appointment at <strong>CareFlow.com 🩺</strong>.</p>
                <p>Appointment details:</p>
                <p>Time: ${dataSend.time}</p>
                <p>Doctor: ${dataSend.doctorName}</p>
                <p style="font-style: italic;">If you did not request this appointment, please ignore this email. Thank you!</p>
                <hr style="border: none; border-top: 1px solid #ddd;">
                <p style="color: #777; font-size: 14px;">For any inquiries, please contact <strong>CareFlow.com 🩺</strong> via email or phone.</p>
                <p>Email: CareFlow@gmail.com</p>
                <p>Phone: 0132659874</p>
            </div>

        `;
  }
  return result;
};

// let sendAttachment = async (dataSend) => {
//   let transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false, // true for port 465, false for other ports
//     auth: {
//       user: process.env.EMAIL_APP,
//       pass: process.env.EMAIL_APP_PASSWORD,
//     },
//   });
//   // console.log("Base64 Image Data: ", dataSend.imgBase64.substring(0, 100)); // Log 100 ký tự đầu

//   let info = await transporter.sendMail({
//     from: '"CareFlow.com 🩺" <thanhthao.thptqt@gmail.com>', // sender address
//     to: dataSend.email, // list of receivers
//     subject: "Kết quả đặt lịch khám bệnh", // Subject line
//     html: getBodyHTMLEmailRemeDy(dataSend), // html body
//     attachments: [
//       {
//         filename: `remedy-${dataSend.patientId}-${new Date().getTime()}.png`,
//         content: dataSend.imgBase64.split("base64,")[1],
//         encoding: "base64",
//       },
//     ],
//   });
// };

// let sendAttachment = async (dataSend) => {
//   try {
//     // 1. Kiểm tra dữ liệu đầu vào
//     if (!dataSend.email || !dataSend.imgBase64) {
//       throw new Error("Missing email or file data");
//     }

//     // 2. Tạo transporter (chỉ tạo 1 lần ngoài hàm nếu có thể)
//     const transporter = nodemailer.createTransport({
//       host: "smtp.gmail.com",
//       port: 587,
//       secure: false,
//       auth: {
//         user: process.env.EMAIL_APP,
//         pass: process.env.EMAIL_APP_PASSWORD,
//       },
//     });

//     // 3. Xử lý base64 → buffer + lấy MIME type + extension
//     const matches = dataSend.imgBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
//     if (!matches || matches.length !== 3) {
//       throw new Error("Invalid base64 format");
//     }

//     const mimeType = matches[1]; // image/png, application/pdf
//     const base64Data = matches[2];
//     const buffer = Buffer.from(base64Data, "base64");

//     // 4. Xác định tên file + extension
//     let extension = "png";
//     if (mimeType === "application/pdf") extension = "pdf";
//     else if (mimeType === "image/jpeg") extension = "jpg";
//     else if (mimeType === "image/jpg") extension = "jpg";

//     const filename = `don-thuoc-${dataSend.patientId}-${Date.now()}.${extension}`;

//     // 5. Gửi email
//     const info = await transporter.sendMail({
//       from: '"CareFlow.com 🩺" <thanhthao.thptqt@gmail.com>', // sender address
//       to: dataSend.email,
//       subject: "Đơn thuốc & Kết quả khám bệnh",
//       html: getBodyHTMLEmailRemeDy(dataSend),
//       attachments: [
//         {
//           filename,
//           content: buffer,
//           encoding: "base64",
//         },
//       ],
//     });

//     console.log("Email sent: ", info.messageId);
//     return info;

//   } catch (error) {
//     console.error("Lỗi gửi email đơn thuốc:", error);
//     throw error; // Để caller xử lý
//   }
// };

let getBodyHTMLEmailRemeDy = (dataSend) => {
  let result = "";
  if (dataSend.language === "vi") {
    result = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2c3e50;">Xin chào ${dataSend.patientName},</h2>
                <p>Cảm ơn bạn đã đặt lịch và khám bệnh tại <strong>CareFlow.com 🩺</strong>.</p>
                <p>Thông tin đơn thuốc/kết quả trong file đính kèm.</p>
                <hr style="border: none; border-top: 1px solid #ddd;">
                <p style="color: #777; font-size: 14px;">Mọi thắc mắc vui lòng liên hệ <strong>CareFlow.com 🩺</strong> qua email hoặc số tổng đài.</p>
                <p>Email: CareFlow@gmail.com</p>
                <p>Số tổng đài: 0132659874</p>
            </div>
        `;
  }
  if (dataSend.language === "en") {
    result = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2c3e50;">Hello ${dataSend.patientName},</h2>
                <p>Thank you for booking your medical appointment at <strong>CareFlow.com 🩺</strong>.</p>
                <p>Prescription/medical bill information in attached file.</p>
                
            </div>

        `;
  }
  return result;
};

// Add function for sending reminder emails
// let sendReminderEmail = async (dataSend) => {
//   let transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false,
//     auth: {
//       user: process.env.EMAIL_APP,
//       pass: process.env.EMAIL_APP_PASSWORD,
//     },
//   });

//   let info = await transporter.sendMail({
//     from: '"CareFlow.com 🩺" <thanhthao.thptqt@gmail.com>',
//     to: dataSend.receiverEmail,
//     subject:
//       dataSend.language === "vi"
//         ? "Nhắc nhở lịch hẹn khám bệnh"
//         : "Appointment Reminder",
//     html: getBodyHTMLEmailReminder(dataSend),
//   });
// };

// HTML template for reminder email
let getBodyHTMLEmailReminder = (dataSend) => {
  let result = "";
  if (dataSend.language === "vi") {
    result = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2c3e50;">Xin chào ${dataSend.patientName},</h2>
                <p>Đây là email nhắc nhở về lịch hẹn khám bệnh của bạn tại <strong>CareFlow.com 🩺</strong>.</p>
                <p style="color: #fc2314ff;">Thông tin lịch hẹn:</p>
                <p>Thời gian: ${dataSend.date} (vào lúc: ${dataSend.time})</p>
                <p>Bác sĩ: ${dataSend.doctorName}</p>
                <p>Tại: ${dataSend.hospitalName}</p>
                <p>Địa điểm: ${dataSend.hospitalAddress}</p>
                <p>Vui lòng đến đúng giờ để được phục vụ tốt nhất.</p>
                <hr style="border: none; border-top: 1px solid #ddd;">
                <p style="color: #777; font-size: 14px;">Mọi thắc mắc vui lòng liên hệ <strong>CareFlow.com 🩺</strong> hoặc số điện thoại 📞 <strong>0123-456-789</strong>.</p>
            </div>
        `;
  }
  if (dataSend.language === "en") {
    result = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2c3e50;">Hello ${dataSend.patientName},</h2>
                <p>This is a reminder for your upcoming medical appointment at <strong>CareFlow.com 🩺</strong>.</p>
                <p>Appointment details:</p>
                <p>Time: ${dataSend.time} (tomorrow)</p>
                <p>Doctor: ${dataSend.doctorName}</p>
                <p>Location: ${dataSend.clinicAddress}</p>
                <p>Please arrive on time for the best service.</p>
                <p style="font-style: italic;">If you need to reschedule, please contact us via this email or phone 📞 0123-456-789.</p>
                <hr style="border: none; border-top: 1px solid #ddd;">
                <p style="color: #777; font-size: 14px;">For any inquiries, please contact <strong>CareFlow.com 🩺</strong>.</p>
            </div>
        `;
  }
  return result;
};

// export const sendResetPasswordEmail = async (dataSend) => {
//   let transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false,
//     auth: {
//       user: process.env.EMAIL_APP,
//       pass: process.env.EMAIL_APP_PASSWORD,
//     },
//   });

//   let info = await transporter.sendMail({
//     from: '"CareFlow.com 🩺" <thanhthao.thptqt@gmail.com>',
//     to: dataSend.receiverEmail,
//     subject: "Đặt lại mật khẩu - CareFlow",
//     html: getResetPasswordHTML(dataSend),
//   });
// };

let getResetPasswordHTML = (dataSend) => {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin:auto; padding:20px; border:1px solid #ddd; border-radius:8px">
      <h2 style="color:#2c3e50;">Yêu cầu đặt lại mật khẩu</h2>
      <p>Xin chào,</p>
      <p>Bạn đã yêu cầu đặt lại mật khẩu tại <b>CareFlow</b>.</p>
      <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu (hiệu lực 15 phút):</p>

      <a href="${dataSend.resetLink}"
        style="display:inline-block; padding:12px 18px; background:#007bff; color:#fff; text-decoration:none; border-radius:5px; margin:15px 0">
        Đặt lại mật khẩu
      </a>

      <p>Nếu không phải bạn yêu cầu, vui lòng bỏ qua email này.</p>

      <hr />
      <p style="font-size:12px; color:#777;">
          CareFlow © ${new Date().getFullYear()}
      </p>
  </div>
  `;
};

export default {
  sendSimpleEmail: sendSimpleEmail,
  sendAttachment: sendAttachment,
  sendReminderEmail: sendReminderEmail,
  sendResetPasswordEmail: sendResetPasswordEmail
};
