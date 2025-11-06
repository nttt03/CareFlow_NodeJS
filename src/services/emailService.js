require("dotenv").config();
import nodemailer from "nodemailer";

let sendSimpleEmail = async (dataSend) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: process.env.EMAIL_APP,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
  let info = await transporter.sendMail({
    from: '"CareFlow.com 🩺" <thanhthao.thptqt@gmail.com>', // sender address
    to: dataSend.receiverEmail, // list of receivers
    subject: "Thông tin đặt lịch khám bệnh", // Subject line
    html: getBodyHTMLEmail(dataSend), // html body
  });
  // console.log('dataSend >>>: ', dataSend);
};

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

let sendAttachment = async (dataSend) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: process.env.EMAIL_APP,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
  // console.log("Base64 Image Data: ", dataSend.imgBase64.substring(0, 100)); // Log 100 ký tự đầu

  let info = await transporter.sendMail({
    from: '"CareFlow.com 🩺" <thanhthao.thptqt@gmail.com>', // sender address
    to: dataSend.email, // list of receivers
    subject: "Kết quả đặt lịch khám bệnh", // Subject line
    html: getBodyHTMLEmailRemeDy(dataSend), // html body
    attachments: [
      {
        filename: `remedy-${dataSend.patientId}-${new Date().getTime()}.png`,
        content: dataSend.imgBase64.split("base64,")[1],
        encoding: "base64",
      },
    ],
  });
};

let getBodyHTMLEmailRemeDy = (dataSend) => {
  let result = "";
  if (dataSend.language === "vi") {
    result = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2c3e50;">Xin chào ${dataSend.patientName},</h2>
                <p>Cảm ơn bạn đã đặt lịch và khám bệnh tại <strong>CareFlow.com 🩺</strong>.</p>
                <p>Thông tin đơn thuốc/hóa đơn y tế trong file đính kèm.</p>

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
let sendReminderEmail = async (dataSend) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_APP,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  let info = await transporter.sendMail({
    from: '"CareFlow.com 🩺" <thanhthao.thptqt@gmail.com>',
    to: dataSend.receiverEmail,
    subject:
      dataSend.language === "vi"
        ? "Nhắc nhở lịch hẹn khám bệnh"
        : "Appointment Reminder",
    html: getBodyHTMLEmailReminder(dataSend),
  });
};

// HTML template for reminder email
let getBodyHTMLEmailReminder = (dataSend) => {
  let result = "";
  if (dataSend.language === "vi") {
    result = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2c3e50;">Xin chào ${dataSend.patientName},</h2>
                <p>Đây là email nhắc nhở về lịch hẹn khám bệnh vào ngày mai của bạn tại <strong>CareFlow.com 🩺</strong>.</p>
                <p style="color: #fc2314ff;">Thông tin lịch hẹn:</p>
                <p>Thời gian: ${dataSend.time} (vào ngày mai)</p>
                <p>Bác sĩ: ${dataSend.doctorName}</p>
                <p>Tại: ${dataSend.hospitalName}</p>
                <p>Địa điểm: ${dataSend.hospitalAddress}</p>
                <p>Vui lòng đến đúng giờ để được phục vụ tốt nhất.</p>
                <p style="font-style: italic;">Nếu bạn cần thay đổi lịch hẹn, vui lòng liên hệ với chúng tôi qua email này hoặc số điện thoại 📞 0123-456-789.</p>
                <hr style="border: none; border-top: 1px solid #ddd;">
                <p style="color: #777; font-size: 14px;">Mọi thắc mắc vui lòng liên hệ <strong>CareFlow.com 🩺</strong>.</p>
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

let sendResetPasswordEmail = async (dataSend) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_APP,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  let info = await transporter.sendMail({
    from: '"CareFlow.com 🩺" <thanhthao.thptqt@gmail.com>',
    to: dataSend.receiverEmail,
    subject: "Đặt lại mật khẩu - CareFlow",
    html: getResetPasswordHTML(dataSend),
  });
};

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

module.exports = {
  sendSimpleEmail: sendSimpleEmail,
  sendAttachment: sendAttachment,
  sendReminderEmail: sendReminderEmail,
  sendResetPasswordEmail: sendResetPasswordEmail
};
