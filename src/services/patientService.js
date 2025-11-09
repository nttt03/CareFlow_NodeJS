import { includes } from "lodash";
import db from "../models/index";
import emailService from "../services/emailService";
import notificationService from "../services/notificationService";
import { v4 as uuidv4 } from "uuid";
require("dotenv").config();

let buildUrlEmail = (doctorId, token) => {
  let result = `${process.env.URL_REACT}/verify-booking?token=${token}&doctorId=${doctorId}`;
  return result;
};

let postBookApointment = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (
        !data.email ||
        !data.doctorId ||
        !data.date ||
        !data.timeType ||
        !data.fullName
      ) {
        resolve({
          errCode: 1,
          errMessage: "Missing parameter...",
        });
      } else {
        let token = uuidv4();

        // 1. Upsert patient
        let user = await db.User.findOrCreate({
          where: { email: data.email },
          defaults: {
            email: data.email,
            roleId: "R3",
            gender: data.selectedGender,
            addressDetail: data.address,
            fullName: data.fullName,
          },
        });

        if (user && user[0]) {
          // 2. Tạo Booking
          let [booking, created] = await db.Booking.findOrCreate({
            where: {
              patientId: user[0].id,
              doctorId: data.doctorId,
              date: data.date,
              timeType: data.timeType,
            },
            defaults: {
              statusId: "S1",
              doctorId: data.doctorId,
              patientId: user[0].id,
              hospitalId: data.hospitalId,
              symptoms: data.symptoms,
              date: data.date,
              timeType: data.timeType,
              token: token,
            },
          });
          if (created) {
            // 4.Tăng số lượng bệnh nhân trong slot
            await db.Schedule.increment("currentNumber", {
              by: 1,
              where: {
                doctorId: data.doctorId,
                date: data.date,
                timeType: data.timeType,
              },
            });

            // 5. Gửi email
            await emailService.sendSimpleEmail({
              receiverEmail: data.email,
              patientName: data.fullName,
              time: data.timeString,
              doctorName: data.doctorName,
              language: data.language,
              redirectLink: buildUrlEmail(data.doctorId, token),
            });
            // 6.Thông báo cho bác sĩ
            await notificationService.createNotification({
              senderId: user[0].id,       // người đặt
              receiverId: data.doctorId,  // bác sĩ nhận
              receiverRole: "R2",         // role bác sĩ
              message: `Bạn có lịch hẹn mới từ ${data.fullName}`,
              url: "/doctor/waiting-approval",
            });
            
            // Gửi thông báo cho từng admin
            let adminList = await db.User.findAll({
              where: { roleId: "R1" },
              attributes: ["id", "fullName"]
            });
            for (let admin of adminList) {
              await notificationService.createNotification({
                senderId: user[0].id,
                receiverId: admin.id,
                receiverRole: "R1",
                message: `Có lịch hẹn mới từ ${data.fullName} với bác sĩ ${data.doctorName}`,
                url: "/system/waiting-approval"
              });
            }
            
          }
        }

        resolve({
          errCode: 0,
          errMessage: "Save booking successfully",
        });
      }
    } catch (e) {
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
  getAppointmentForNoti: getAppointmentForNoti
};
