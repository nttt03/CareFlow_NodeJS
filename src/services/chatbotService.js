import db from "../models/index.js";
import { Op } from "sequelize";
import moment from "moment-timezone";

await import("moment/locale/vi.js");
moment.locale("vi");

const getBotReply = async (message) => {
  const text = message.toLowerCase();

  if (text.includes("giờ làm việc")) {
    return "Giờ làm việc là từ 8h đến 17h, thứ 2 đến thứ 7.";
  }

  if (text.includes("khoa nhi")) {
    return "Chúng tôi có khoa Nhi với đội ngũ bác sĩ giàu kinh nghiệm.";
  }

  if (text.includes("bác sĩ")) {
    return "Bạn cần bác sĩ chuyên khoa nào? Nội, Ngoại, Nhi, Tai Mũi Họng?";
  }

  return "Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Bạn có thể đặt lại không?";
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
        // let todayStart = new Date().setHours(0, 0, 0, 0); 
        let todayStart = moment().tz("Asia/Ho_Chi_Minh").startOf("day").valueOf();
        let appointments = await db.Booking.findAll({
          where: {
            patientId: inputId,
            statusId: { [db.Sequelize.Op.in]: ["S1", "S2", "S5"] },
            date: {
              [db.Sequelize.Op.gte]: todayStart,
            },

          },
          attributes: ["id", "statusId", "patientId", "date", "timeType", "symptoms", "rejectReason", "createdAt", "updatedAt"],
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
        appointments = appointments.map((item) => {
          return {
            ...item,
            // formattedDate: moment(Number(item.date)).format("dddd, DD/MM/YYYY"),
            formattedDate: moment(Number(item.date))
              .tz("Asia/Ho_Chi_Minh")
              .format("dddd, DD/MM/YYYY"),
          };
        });
        console.log("dataAppointments: ", appointments)
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

let getTopDoctorHome = (limit) => {
    return new Promise(async(resolve, reject) => {
        try {
            let users = await db.User.findAll({
                where: { roleId: 'R2', status: 'A1' },
                attributes: {
                    exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken', 'avatar'],
                    include: [
                        // Dùng literal để COUNT trực tiếp trong subquery
                        [db.sequelize.literal(`(
                            SELECT COUNT(*) 
                            FROM bookings AS b 
                            WHERE b.doctorId = User.id 
                            AND b.statusId IN ('S2', 'S4')
                        )`), 'bookingCount']
                    ]
                },
                include: [
                    { model: db.Datacode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                    { model: db.Datacode, as: 'genderData', attributes: ['valueEn', 'valueVi'] },
                    {
                        model: db.Doctor_Infor,
                        as: 'doctorInfor',
                        attributes: ['specialtyId'],
                        include: [
                            {
                                model: db.Specialty,
                                as: 'specialty',
                                attributes: ['name']
                            }
                        ]
                    }
                ],
                // group: ['User.id'],
                order: [[db.sequelize.literal('bookingCount'), 'DESC']],
                limit: limit,
                // raw: true,
                nest: true
            });

            resolve({
                errCode: 0,
                data: users
            });
        } catch (e) {
            console.log(e);
            reject(e);
        }
    });
};

// let searchAll = async ({ keyword, provinceId, specialtyId, hospitalId }) => {
//     const searchCondition = keyword
//       ? { [Op.like]: `%${keyword}%` }
//       : {};

//     const locationFilter = {
//       ...(provinceId && { provinceId }),
//     };

//     const doctors = await db.User.findAll({
//       where: {
//         roleId: "R2",
//         ...locationFilter,
//         ...(keyword && {
//           fullName: searchCondition,
//         }),
//       },
//       attributes: {
//         exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken', 'avatar'],
//       },
//       include: [
//         {
//           model: db.Doctor_Infor,
//           as: "doctorInfor",
//           where: {
//             ...(specialtyId && { specialtyId }),
//             ...(hospitalId && { hospitalId }),
//           },
//           include: [
//             { model: db.Specialty, as: "specialty" },
//             { model: db.Hospital, as: "hospital" },
//           ],
//           raw: true,
//           nest: true,
//         },
//         { model: db.Province, as: "provinceData" },
//       ],
//       raw: true,
//       nest: true,

//     });

//     const hospitals = await db.Hospital.findAll({
//       where: {
//         ...locationFilter,
//         ...(keyword && { name: searchCondition }),
//         ...(hospitalId && { id: hospitalId }),
//       },
//       attributes: {
//         exclude: ['image'],
//       },
//       include: [
//         { model: db.Province, as: "provinceData" },
//       ],
//       raw: true,
//       nest: true,
//     });

//     const specialties = await db.Specialty.findAll({
//       where: {
//         ...(keyword && { name: searchCondition }),
//         ...(specialtyId && { id: specialtyId }),
//       },
//       attributes: {
//         exclude: ['image'],
//       },
//     });

//     return {
//       doctors,
//       hospitals,
//       specialties,
//     };
//   }

let searchAll = async ({ keyword, provinceName }) => {
  let provinceId;

  if (provinceName) {
    const province = await db.Province.findOne({
      where: {
        name: { [Op.like]: `%${provinceName}%` }
      }
    });
    if (province) provinceId = province.id;
  }

  const searchCondition = keyword ? { [Op.like]: `%${keyword}%` } : {};

  // --- Chỉ tìm bệnh viện ---
  const hospitals = await db.Hospital.findAll({
    where: {
      ...(provinceId && { provinceId }), // lọc theo tỉnh nếu có
      ...(keyword && {
        [Op.or]: [
          { name: searchCondition },          // tìm theo tên
          { addressDetail: searchCondition } // tìm theo địa chỉ chi tiết
        ]
      }),
    },
    attributes: {
      exclude: ["image"],
    },
    include: [
      { model: db.Province, as: "provinceData" },
      { model: db.CommuneUnit, as: "communeUnitData" },
    ],
    raw: true,
    nest: true,
  });

  return { hospitals };
};

let searchDoctor = async ({ keyword, provinceName }) => {
  let provinceId;

  if (provinceName) {
    const province = await db.Province.findOne({
      where: { name: { [Op.like]: `%${provinceName}%` } },
    });
    if (province) provinceId = province.id;
  }

  const searchCondition = keyword ? { [Op.like]: `%${keyword}%` } : {};
  const locationFilter = provinceId ? { provinceId } : {};

  // --- Tìm bác sĩ ---
  const doctors = await db.User.findAll({
    where: {
      roleId: "R2", // chỉ lấy bác sĩ
      ...locationFilter,
      ...(keyword && { fullName: searchCondition }), // lọc theo tên nếu có
    },
    attributes: {
      exclude: ["password", "resetPasswordExpires", "resetPasswordToken", "avatar", "CCCD"],
    },
    include: [
      {
        model: db.Doctor_Infor,
        as: "doctorInfor",
        attributes: { exclude: ["price", "count"] },
        include: [
          { model: db.Specialty, as: "specialty", attributes: { exclude: ["image"] } },
          { model: db.Hospital, as: "hospital", attributes: { exclude: ["image"] } },
        ],
      },
      { model: db.Province, as: "provinceData" },
    ],
  });

  return { doctors };
};


export default {
  getBotReply,
  getNewAppointment,
  getTopDoctorHome,
  searchAll,
  searchDoctor
};
