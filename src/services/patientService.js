import { includes } from "lodash";
import db from "../models/index";
import emailService from "../services/emailService";
import notificationService from "../services/notificationService";
import { v4 as uuidv4 } from "uuid";
require("dotenv").config();
const { Op, Sequelize } = require("sequelize");

let buildUrlEmail = (doctorId, token) => {
  let result = `${process.env.URL_REACT}/verify-booking?token=${token}&doctorId=${doctorId}`;
  return result;
};

// let postBookApointment = (data) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       if (
//         !data.email ||
//         !data.doctorId ||
//         !data.date ||
//         !data.timeType ||
//         !data.fullName
//       ) {
//         return resolve({
//           errCode: 1,
//           errMessage: "Missing parameter...",
//         });
//       }

//       let token = uuidv4();

//       // 1. Upsert patient
//       let [user] = await db.User.findOrCreate({
//         where: { email: data.email },
//         defaults: {
//           email: data.email,
//           roleId: "R3",
//           gender: data.selectedGender,
//           addressDetail: data.address,
//           fullName: data.fullName,
//         },
//       });

//       // 3. Đặt lịch nếu chưa có với bác sĩ đó
//       let [booking, created] = await db.Booking.findOrCreate({
//         where: {
//           patientId: user.id,
//           doctorId: data.doctorId,
//           date: data.date,
//           timeType: data.timeType,
//           statusId: { [db.Sequelize.Op.ne]: "S5" },
//         },
//         defaults: {
//           statusId: "S1",
//           doctorId: data.doctorId,
//           patientId: user.id,
//           hospitalId: data.hospitalId,
//           symptoms: data.symptoms,
//           date: data.date,
//           timeType: data.timeType,
//           token: token,
//         },
//       });

//       if (!created) {
//         return resolve({
//           errCode: 3,
//           errMessage: "Bạn đã đặt lịch với bác sĩ này vào thời gian này rồi.",
//         });
//       }

//       // 2. Kiểm tra conflict lịch: bệnh nhân đặt trùng giờ với bác sĩ khác
//       let conflictBooking = await db.Booking.findOne({
//         where: {
//           patientId: user.id,
//           date: data.date,
//           timeType: data.timeType,
//           statusId: { [db.Sequelize.Op.ne]: "S5" }, // loại lịch đã hủy
//         },
//       });

//       if (conflictBooking) {
//         return resolve({
//           errCode: 2,
//           errMessage:
//             "Bạn đã có lịch khám trong khung giờ này. Vui lòng chọn giờ khác.",
//         });
//       }

//       // 4. Tăng số lượng bệnh nhân trong slot
//       await db.Schedule.increment("currentNumber", {
//         by: 1,
//         where: {
//           doctorId: data.doctorId,
//           date: data.date,
//           timeType: data.timeType,
//         },
//       });

//       // 5. Gửi email xác nhận
//       await emailService.sendSimpleEmail({
//         receiverEmail: data.email,
//         patientName: data.fullName,
//         time: data.timeString,
//         doctorName: data.doctorName,
//         language: data.language,
//         redirectLink: buildUrlEmail(data.doctorId, token),
//       });

//       // 6. Notification cho bác sĩ
//       await notificationService.createNotification({
//         senderId: user.id,
//         receiverId: data.doctorId,
//         receiverRole: "R2",
//         message: `Bạn có lịch hẹn mới từ ${data.fullName}`,
//         url: "/doctor/waiting-approval",
//       });

//       // 7. Notification cho admin
//       let adminList = await db.User.findAll({
//         where: { roleId: "R1" },
//         attributes: ["id", "fullName"],
//       });
//       for (let admin of adminList) {
//         await notificationService.createNotification({
//           senderId: user.id,
//           receiverId: admin.id,
//           receiverRole: "R1",
//           message: `Có lịch hẹn mới từ ${data.fullName} với bác sĩ ${data.doctorName}`,
//           url: "/system/waiting-approval",
//         });
//       }

//       return resolve({
//         errCode: 0,
//         errMessage: "Đặt lịch thành công",
//       });

//     } catch (e) {
//       reject(e);
//     }
//   });
// };

let postBookApointment = (data) => {
  return new Promise(async (resolve, reject) => {
    const t = await db.sequelize.transaction(); // Bắt đầu transaction
    try {
      // 1. Kiểm tra tham số bắt buộc
      if (
        !data.email ||
        !data.doctorId ||
        !data.date ||
        !data.timeType ||
        !data.fullName
      ) {
        return resolve({
          errCode: 1,
          errMessage: "Missing parameter...",
        });
      }

      const token = uuidv4();

      // 2. Upsert bệnh nhân (patient)
      const [user] = await db.User.findOrCreate({
        where: { email: data.email },
        defaults: {
          email: data.email,
          roleId: "R3",
          gender: data.selectedGender,
          addressDetail: data.address,
          fullName: data.fullName,
        },
        transaction: t,
      });

      // 3. GỘP: Kiểm tra tất cả lịch hiện tại (trừ đã hủy S5)
      const existingBookings = await db.Booking.findAll({
        where: {
          patientId: user.id,
          date: data.date,
          timeType: data.timeType,
          statusId: { [db.Sequelize.Op.in]: ["S1", "S2", "S3"] },
        },
        attributes: ["id", "doctorId"],
        transaction: t,
      });

      if (existingBookings.length > 0) {
        const hasSameDoctor = existingBookings.some(
          (b) => b.doctorId === data.doctorId
        );

        if (hasSameDoctor) {
          await t.rollback();
          return resolve({
            errCode: 3,
            errMessage: "Bạn đã đặt lịch với bác sĩ này vào thời gian này rồi.",
          });
        } else {
          await t.rollback();
          return resolve({
            errCode: 2,
            errMessage:
              "Bạn đã có lịch khám với bác sĩ khác trong khung giờ này. Vui lòng chọn giờ khác.",
          });
        }
      }

      // 4. Kiểm tra slot còn trống (nếu cần)
      const schedule = await db.Schedule.findOne({
        where: {
          doctorId: data.doctorId,
          date: data.date,
          timeType: data.timeType,
        },
        transaction: t,
      });

      if (!schedule) {
        await t.rollback();
        return resolve({
          errCode: 4,
          errMessage: "Khung giờ không tồn tại.",
        });
      }

      if (schedule.currentNumber >= schedule.maxNumber) {
        await t.rollback();
        return resolve({
          errCode: 5,
          errMessage: "Khung giờ đã đầy. Vui lòng chọn giờ khác.",
        });
      }

      // 5. Tạo lịch mới
      const [booking, created] = await db.Booking.findOrCreate({
        where: {
          patientId: user.id,
          doctorId: data.doctorId,
          date: data.date,
          timeType: data.timeType,
          statusId: { [db.Sequelize.Op.ne]: "S5" },
        },
        defaults: {
          statusId: "S1",
          doctorId: data.doctorId,
          patientId: user.id,
          hospitalId: data.hospitalId,
          symptoms: data.symptoms,
          date: data.date,
          timeType: data.timeType,
          token: token,
        },
        transaction: t,
      });

      if (!created) {
        await t.rollback();
        return resolve({
          errCode: 3,
          errMessage: "Bạn đã đặt lịch với bác sĩ này vào thời gian này rồi.",
        });
      }

      // 6. Tăng số lượng bệnh nhân trong slot
      await db.Schedule.increment("currentNumber", {
        by: 1,
        where: {
          doctorId: data.doctorId,
          date: data.date,
          timeType: data.timeType,
        },
        transaction: t,
      });

      // 7. Gửi email xác nhận (không rollback nếu lỗi email)
      try {
        await emailService.sendSimpleEmail({
          receiverEmail: data.email,
          patientName: data.fullName,
          time: data.timeString,
          doctorName: data.doctorName,
          language: data.language,
          redirectLink: buildUrlEmail(data.doctorId, token),
        });
      } catch (emailError) {
        console.warn("Email gửi thất bại, nhưng lịch đã được tạo:", emailError);
      }

      // 8. Gửi thông báo cho bác sĩ
      try {
        await notificationService.createNotification({
          senderId: user.id,
          receiverId: data.doctorId,
          receiverRole: "R2",
          message: `Bạn có lịch hẹn mới từ ${data.fullName}`,
          url: "/doctor/waiting-approval",
        });
      } catch (notifError) {
        console.warn("Thông báo bác sĩ thất bại:", notifError);
      }

      // 9. Gửi thông báo cho tất cả admin
      try {
        const adminList = await db.User.findAll({
          where: { roleId: "R1" },
          attributes: ["id", "fullName"],
          transaction: t,
        });

        for (const admin of adminList) {
          await notificationService.createNotification({
            senderId: user.id,
            receiverId: admin.id,
            receiverRole: "R1",
            message: `Có lịch hẹn mới từ ${data.fullName} với bác sĩ ${data.doctorName}`,
            url: "/system/waiting-approval",
          });
        }
      } catch (adminError) {
        console.warn("Thông báo admin thất bại:", adminError);
      }

      // 9. Gửi thông báo cho leader hospital
      try {
        let leader = await db.User.findOne({
          where: { roleId: "R4", hospitalId: data.hospitalId }
        });

        if (!leader || !leader.hospitalId) {
          return resolve({
            errCode: 2,
            errMessage: 'Leader not found or not assigned to any hospital'
          });
        }
        await notificationService.createNotification({
          senderId: user.id,
          receiverId: leader.id,
          receiverRole: "R4",
          message: `Có lịch hẹn mới từ ${data.fullName} với bác sĩ ${data.doctorName}`,
          url: "/leader-hospital/waiting-approval",
        });
      } catch (notifError) {
        console.warn("Thông báo lãnh đạo bệnh viện thất bại:", notifError);
      }

      // 10. Thành công → commit
      await t.commit();

      return resolve({
        errCode: 0,
        errMessage: "Đặt lịch thành công",
        data: {
          bookingId: booking.id,
          token: token,
        },
      });
    } catch (e) {
      if (t) await t.rollback();
      console.error("Lỗi đặt lịch:", e);
      reject(e);
    }
  });
};

let postVerifyBookApointment = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.token || !data.doctorId) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameters",
        });
      } else {
        let appointment = await db.Booking.findOne({
          where: {
            token: data.token,
            doctorId: data.doctorId,
            statusId: "S1",
          },
          // để raw: false (nó sẽ trả ra 1 sequelize object) thì mới dùng được hàm update (appointment.save())
          // trong file config.json để raw: true (nó sẽ trả ra 1 object của javascript)
          raw: false,
        });

        if (appointment) {
          // update status (gán dl trước r mới dùng được hàm update)
          appointment.statusId = "S2";
          await appointment.save();

          resolve({
            errCode: 0,
            errMessage: "Xác nhận lịch hẹn thành công!",
          });
        } else {
          resolve({
            errCode: 2,
            errMessage: "Lịch hẹn đã được xác nhận hoặc không tồn tại!",
          });
        }
      }
    } catch (e) {
      reject(e);
    }
  });
};

let getNewAppointment = (inputId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!inputId) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameters patientId",
        });
      } else {
        let appointments = await db.Booking.findAll({
          where: {
            patientId: inputId,
            statusId: { [db.Sequelize.Op.in]: ["S1", "S2", "S5"] }, // Lọc statusId là 'S1' hoặc 'S2'
          },
          attributes: ["statusId", "patientId", "date", "timeType", "rejectReason"],
          include: [
            {
              model: db.Doctor_Infor,
              as: "doctorInfoData",
              attributes: ["doctorId", "hospitalId", "specialtyId"],
              include: [
                {
                  model: db.Hospital,
                  as: "hospital",
                  attributes: ["name", "addressDetail", "provinceId"],
                  include: [
                    {
                      model: db.Province,
                      as: "provinceData",
                    },
                  ],
                },
              ],
            },
            {
              model: db.User,
              as: "infoDataDoctor",
              attributes: ["fullName"],
              include: [
                {
                  model: db.Datacode,
                  as: "positionData",
                  attributes: ["valueEn", "valueVi"],
                },
              ],
            },
            {
              model: db.Datacode,
              as: "timeTypeDataPatient",
              attributes: ["valueEn", "valueVi"],
            },
            {
              model: db.Datacode,
              as: "statusData",
              attributes: ["valueEn", "valueVi"],
            },
          ],
          raw: true,
          nest: true,
        });
        resolve({
          errCode: 0,
          dataAppointments: appointments,
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

let getAppointmentForNoti = (bookingId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!bookingId) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameters bookingId",
        });
      } else {
        let appointments = await db.Booking.findOne({
          where: {
            id: bookingId,
          },
          attributes: {
            exclude: ["token"],
          },
          include: [
            {
              model: db.Doctor_Infor,
              as: "doctorInfoData",
              attributes: ["doctorId", "hospitalId", "specialtyId"],
              include: [
                {
                  model: db.Hospital,
                  as: "hospital",
                  attributes: ["name", "addressDetail", "provinceId"],
                  include: [
                    {
                      model: db.Province,
                      as: "provinceData",
                    },
                  ],
                },
              ],
            },
            {
              model: db.User,
              as: "infoDataDoctor",
              attributes: ["fullName"],
              include: [
                {
                  model: db.Datacode,
                  as: "positionData",
                  attributes: ["valueEn", "valueVi"],
                },
              ],
            },
            {
              model: db.Datacode,
              as: "timeTypeDataPatient",
              attributes: ["valueEn", "valueVi"],
            },
            {
              model: db.Datacode,
              as: "statusData",
              attributes: ["valueEn", "valueVi"],
            },
          ],
          raw: true,
          nest: true,
        });
        resolve({
          errCode: 0,
          dataAppointments: appointments,
        });
      }
    } catch (e) {
      reject(e);
    }
  });
}

let getDoneAppointment = (inputId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!inputId) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameters patientId",
        });
      } else {
        let appointments = await db.Booking.findAll({
          where: {
            patientId: inputId,
            statusId: "S4",
          },
          attributes: ["statusId", "patientId", "date", "timeType"],
          include: [
            {
              model: db.Doctor_Infor,
              as: "doctorInfoData",
              attributes: ["doctorId", "hospitalId", "specialtyId"],
              include: [
                {
                  model: db.Hospital,
                  as: "hospital",
                  attributes: ["name", "addressDetail", "provinceId"],
                  include: [
                    {
                      model: db.Province,
                      as: "provinceData",
                    },
                  ],
                },
              ],
            },
            {
              model: db.User,
              as: "infoDataDoctor",
              attributes: ["fullName"],
              include: [
                {
                  model: db.Datacode,
                  as: "positionData",
                  attributes: ["valueEn", "valueVi"],
                },
              ],
            },
            {
              model: db.Datacode,
              as: "timeTypeDataPatient",
              attributes: ["valueEn", "valueVi"],
            },
            {
              model: db.Datacode,
              as: "statusData",
              attributes: ["valueEn", "valueVi"],
            },
          ],
          raw: true,
          nest: true,
        });
        resolve({
          errCode: 0,
          dataAppointments: appointments,
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

let getAppointmentNeedReview = (inputId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!inputId) {
        return resolve({
          errCode: 1,
          errMessage: "Missing required parameters patientId",
        });
      }

      const now = Date.now();
      const sevenDaysAgoMs = now - 7 * 24 * 60 * 60 * 1000;
      const minDate = sevenDaysAgoMs;

      // Lấy danh sách bookingId đã được đánh giá
      const reviewedBookingIds = await db.Review.findAll({
        attributes: ['bookingId'],
        raw: true
      }).then(reviews => reviews.map(r => r.bookingId));

      let appointments = await db.Booking.findAll({
        where: {
          patientId: inputId,
          statusId: "S4",
          date: {
            [db.Sequelize.Op.gte]: minDate,
          },
          id: {
            [db.Sequelize.Op.notIn]: reviewedBookingIds.length > 0 ? reviewedBookingIds : [0]
          }
        },
        attributes: ["id", "statusId", "patientId", "date", "timeType"],
        include: [
          {
            model: db.Doctor_Infor,
            as: "doctorInfoData",
            attributes: ["doctorId", "hospitalId", "specialtyId"],
            include: [
              {
                model: db.Hospital,
                as: "hospital",
                attributes: ["name", "addressDetail", "provinceId"],
                include: [
                  {
                    model: db.Province,
                    as: "provinceData",
                  },
                ],
              },
            ],
          },
          {
            model: db.User,
            as: "infoDataDoctor",
            attributes: ["fullName"],
            include: [
              {
                model: db.Datacode,
                as: "positionData",
                attributes: ["valueVi", "valueEn"],
              },
            ],
          },
          {
            model: db.Datacode,
            as: "timeTypeDataPatient",
            attributes: ["valueVi"],
          },
          {
            model: db.Datacode,
            as: "statusData",
            attributes: ["valueVi"],
          },
        ],
        order: [["date", "DESC"]],
        raw: true,
        nest: true,
      });

      resolve({
        errCode: 0,
        dataAppointments: appointments,
      });
    } catch (e) {
      console.error("getAppointmentNeedReview Error:", e);
      reject(e);
    }
  });
};

// sendAppointmentReminder
let sendAppointmentReminder = () => {
  return new Promise(async (resolve, reject) => {
    try {
      // Calculate the date for tomorrow
      // const tomorrow = new Date();
      // tomorrow.setDate(tomorrow.getDate() + 1);
      // const tomorrowString = tomorrow.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      const { Op } = db.Sequelize;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Tính timestamp đầu ngày và cuối ngày của ngày mai
      const startOfDay = new Date(tomorrow.setHours(0, 0, 0, 0)).getTime(); // 00:00
      const endOfDay = new Date(tomorrow.setHours(23, 59, 59, 999)).getTime(); // 23:59

      // Find confirmed appointments for tomorrow
      let appointments = await db.Booking.findAll({
        where: {
          statusId: "S2",
          date: {
            [Op.between]: [startOfDay, endOfDay],
          },
        },
        attributes: ["patientId", "doctorId", "hospitalId", "date", "timeType"],
        include: [
          {
            model: db.User,
            as: "patientData",
            // attributes: ['email', 'fullName', 'language'],
            attributes: ["email", "fullName"],
          },
          {
            model: db.User,
            as: "infoDataDoctor",
            attributes: ["fullName"],
            include: [
              {
                model: db.Datacode,
                as: "positionData",
                attributes: ["valueEn", "valueVi"],
              },
            ],
          },
          {
            model: db.Hospital,
            as: "hospitalData",
            attributes: ["addressDetail", "name"],
          },
          {
            model: db.Datacode,
            as: "timeTypeDataPatient",
            attributes: ["valueEn", "valueVi"],
          },
        ],
        raw: true,
        nest: true,
      });

      if (appointments && appointments.length > 0) {
        // Send reminder email for each appointment
        for (let appointment of appointments) {
          await emailService.sendReminderEmail({
            receiverEmail: appointment.patientData.email,
            patientName: appointment.patientData.fullName,
            time:
              appointment.timeTypeDataPatient.valueVi ||
              appointment.timeTypeDataPatient.valueEn,
            doctorName: `${
              appointment.infoDataDoctor.positionData.valueVi ||
              appointment.infoDataDoctor.positionData.valueEn
            } ${appointment.infoDataDoctor.fullName}`,
            hospitalName: appointment.hospitalData.name,
            hospitalAddress: appointment.hospitalData.addressDetail,
            // language: appointment.patientData.language || 'vi',
            language: "vi", // hoặc 'en' nếu mặc định gửi tiếng Anh
          });
        }

        resolve({
          errCode: 0,
          errMessage: "Reminder emails sent successfully",
          count: appointments.length,
        });
      } else {
        resolve({
          errCode: 0,
          errMessage: "No appointments found for tomorrow",
          count: 0,
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

let getInfoUserById = (inputId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!inputId) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameter!",
        });
      } else {
        let data = await db.User.findOne({
          where: {
            id: inputId,
          },
          attributes: {
            exclude: ["password"],
          },
          include: [
            {
              model: db.Province,
              as: "provinceData",
              attributes: ["id", "code", "name"],
            },
            {
              model: db.CommuneUnit,
              as: "communeUnitData",
              attributes: ["id", "code", "name", "type"],
            },
            {
              model: db.Datacode,
              as: "genderData",
              attributes: ["valueEn", "valueVi"],
            },
          ],
          raw: false,
          nest: true,
        });

        if (data && data.avatar) {
          data.avatar = Buffer.from(data.avatar, "base64").toString("binary");
        }
        if (!data) {
          data = {};
        }

        resolve({
          errCode: 0,
          data: data,
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

const updateInfoByUser = async (userId, data) => {
  try {
    let user = await db.User.findOne({
      where: { id: userId },
      raw: false,
    });

    if (!user) {
      return {
        errCode: 1,
        errMessage: "Không tìm thấy user!",
      };
    }

    // cập nhật thông tin
    user.fullName = data.fullName ?? user.fullName;
    user.phoneNumber = data.phoneNumber ?? user.phoneNumber;
    user.dateOfBirth = data.dateOfBirth ?? user.dateOfBirth;
    user.gender = data.gender ?? user.gender; // "M" / "F"
    user.addressDetail = data.addressDetail ?? user.addressDetail;
    user.email = data.email ?? user.email;
    user.CCCD = data.CCCD ?? user.CCCD;
    user.provinceId = data.provinceId ?? user.provinceId;
    user.avatar = data.avatar ?? user.avatar;

    await user.save();

    // lấy lại thông tin kèm liên kết
    const updatedUser = await db.User.findOne({
      where: { id: userId },
      attributes: { exclude: ["password"] },
      include: [
        {
          model: db.Datacode,
          as: "genderData",
          attributes: ["valueVi", "valueEn"],
        },
        {
          model: db.Province,
          as: "provinceData",
          attributes: ["id", "code", "name"],
        },
      ],
      raw: false,
      nest: true,
    });

    if (updatedUser.avatar) {
      updatedUser.avatar = Buffer.from(updatedUser.avatar, "base64").toString(
        "binary"
      );
    }

    return {
      errCode: 0,
      errMessage: "Cập nhật thông tin thành công!",
      data: updatedUser,
    };
  } catch (e) {
    console.error("Update user service error:", e);
    return {
      errCode: -1,
      errMessage: "Lỗi server khi cập nhật!",
    };
  }
};

const toggleFavoriteService = async (userId, hospitalId, doctorId) => {
  const existingFavorite = await db.Favorite.findOne({
    where: {
      userId,
      hospitalId: hospitalId || null,
      doctorId: doctorId || null,
    },
    raw: false,
  });

  if (existingFavorite) {
    await existingFavorite.destroy();
    return { errCode: 0, message: "Removed from favorites", isFavorite: false };
  } else {
    await db.Favorite.create({
      userId,
      hospitalId: hospitalId || null,
      doctorId: doctorId || null,
    });
    return { errCode: 0, message: "Added to favorites", isFavorite: true };
  }
};

export const getUserFavorites = async (userId) => {
  try {
    const favorites = await db.Favorite.findAll({
      where: { userId },
      include: [
        {
          model: db.Hospital,
          as: "hospital",
        },
        {
          model: db.User,
          as: "doctor",
          attributes: ["id", "fullName", "addressDetail", "phoneNumber", "positionId", "avatar"],
        },
      ],
      raw: false,
      nest: true,
    });

    return {
      errCode: 0,
      message: "Lấy danh sách yêu thích thành công!",
      data: favorites,
    };
  } catch (error) {
    console.error("Error getUserFavorites:", error);
    return {
      errCode: 1,
      message: "Đã xảy ra lỗi khi lấy danh sách yêu thích!",
      error: error.message,
    };
  }
};

let searchAll = async ({ keyword, provinceId, specialtyId, hospitalId }) => {
    const searchCondition = keyword
      ? { [Op.like]: `%${keyword}%` }
      : {};

    const locationFilter = {
      ...(provinceId && { provinceId }),
    };

    const doctors = await db.User.findAll({
      where: {
        roleId: "R2",
        ...locationFilter,
        ...(keyword && {
          fullName: searchCondition,
        }),
      },
      include: [
        {
          model: db.Doctor_Infor,
          as: "doctorInfor",
          where: {
            ...(specialtyId && { specialtyId }),
            ...(hospitalId && { hospitalId }),
          },
          include: [
            { model: db.Specialty, as: "specialty" },
            { model: db.Hospital, as: "hospital" },
          ],
          raw: true,
          nest: true,
        },
        { model: db.Province, as: "provinceData" },
      ],
      raw: true,
      nest: true,

    });

    const hospitals = await db.Hospital.findAll({
      where: {
        ...locationFilter,
        ...(keyword && { name: searchCondition }),
        ...(hospitalId && { id: hospitalId }),
      },
      include: [
        { model: db.Province, as: "provinceData" },
      ],
      raw: true,
      nest: true,
    });

    const specialties = await db.Specialty.findAll({
      where: {
        ...(keyword && { name: searchCondition }),
        ...(specialtyId && { id: specialtyId }),
      },
    });

    return {
      doctors,
      hospitals,
      specialties,
    };
}

let handleCreateReview = async (userId, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { bookingId, rating, comment, isAnonymous } = data;

      if (!bookingId || !rating) {
        return resolve({
          errCode: 1,
          errMessage: 'Thiếu thông tin bắt buộc!',
          DT: ''
        });
      }

      if (rating < 0 || rating > 5) {
        return resolve({
          errCode: 1,
          errMessage: 'Điểm đánh giá phải từ 0 đến 5!',
          DT: ''
        });
      }

      // 1. Kiểm tra user tồn tại
      let user = await db.User.findOne({
        where: { id: userId },
        raw: false
      });
      if (!user) {
        return resolve({
          errCode: 2,
          errMessage: 'Người dùng không tồn tại!',
          DT: ''
        });
      }

      // 2. Kiểm tra booking hợp lệ
      let booking = await db.Booking.findOne({
        where: {
          id: bookingId,
          patientId: userId,
          statusId: 'S4'
        },
        raw: false,
        include: [
          { model: db.Doctor_Infor, as: 'doctorInfoData' }
        ]
      });

      if (!booking) {
        return resolve({
          errCode: 3,
          errMessage: 'Lịch khám không tồn tại hoặc chưa hoàn thành!',
          DT: ''
        });
      }

      // 3. Kiểm tra thời hạn 7 ngày
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const bookingDate = new Date(parseInt(booking.date));
      if (bookingDate < sevenDaysAgo) {
        return resolve({
          errCode: 4,
          errMessage: 'Đã quá hạn đánh giá (7 ngày)!',
          DT: ''
        });
      }

      // 4. Kiểm tra đã đánh giá chưa
      let existingReview = await db.Review.findOne({
        where: { bookingId },
        raw: false
      });
      if (existingReview) {
        return resolve({
          errCode: 5,
          errMessage: 'Bạn đã đánh giá lịch này rồi!',
          DT: ''
        });
      }

      // 5. Tạo đánh giá
      let status = rating >= 3.0 ? 'approved' : 'pending';

      let review = await db.Review.create({
        patientId: userId,
        doctorId: booking.doctorId,
        bookingId,
        rating: parseFloat(rating).toFixed(2),
        comment: comment?.trim() || null,
        isAnonymous: !!isAnonymous,
        status
      });

      // 6. Cập nhật rating bác sĩ
      await updateDoctorRating(booking.doctorId);

      booking.reviewStatus = 'reviewed';
      await booking.save();

      resolve({
        errCode: 0,
        errMessage: 'Đánh giá thành công!',
        DT: review.get({ plain: true })
      });

    } catch (e) {
      reject(e);
    }
  });
};

// Cập nhật rating trung bình + count
let updateDoctorRating = async (doctorId) => {
  try {
    let result = await db.Review.findOne({
      attributes: [
        [db.sequelize.fn('AVG', db.sequelize.col('rating')), 'avgRating'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total']
      ],
      where: { doctorId, status: 'approved' },
      raw: true
    });

    let avgRating = result.avgRating ? parseFloat(result.avgRating).toFixed(2) : null;
    let count = parseInt(result.total) || 0;

    await db.Doctor_Infor.update(
      { rating: avgRating, count },
      { where: { doctorId } }
    );
  } catch (e) {
    console.error('Update Doctor Rating Error:', e);
  }
};

let getReviewsService = async (doctorId) => {
  try {
    let where = {};
    if (doctorId) {
      where.doctorId = doctorId;
    }

    const reviews = await db.Review.findAll({
      where,
      include: [
        {
          model: db.User,
          as: "patient",
          attributes: ["id", "fullName", "avatar"],
        },
        {
              model: db.User,
              as: "doctor",
              attributes: ["id", "fullName", "avatar"],
              include: [
                {
                  model: db.Datacode,
                  as: "positionData",
                  attributes: ["valueEn", "valueVi"],
                },
              ],
              raw: true,
              nest: true,
            },
        {
          model: db.Booking,
          as: "booking",
          attributes: ["id", "date", "timeType"],
        },
      ],
      raw: true,
      nest: true,
      order: [["createdAt", "DESC"]],
    });

    return {
      errCode: 0,
      data: reviews,
    };
  } catch (error) {
    console.log(error);
    return {
      errCode: -1,
      message: "Error from server",
    };
  }
};

module.exports = {
  postBookApointment: postBookApointment,
  postVerifyBookApointment: postVerifyBookApointment,
  getNewAppointment: getNewAppointment,
  getDoneAppointment: getDoneAppointment,
  sendAppointmentReminder: sendAppointmentReminder,
  getInfoUserById: getInfoUserById,
  updateInfoByUser: updateInfoByUser,
  toggleFavoriteService: toggleFavoriteService,
  getUserFavorites: getUserFavorites,
  getAppointmentForNoti: getAppointmentForNoti,
  searchAll: searchAll,
  getAppointmentNeedReview: getAppointmentNeedReview,
  handleCreateReview: handleCreateReview,
  getReviewsService: getReviewsService,

};
