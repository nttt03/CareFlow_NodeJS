import db from "../models/index";
const { Op, Sequelize } = require("sequelize");

const getDoctorStatistics = async (doctorId) => {
  try {
    // Tổng số lịch hẹn theo trạng thái
    const bookingsByStatus = await db.Booking.findAll({
      attributes: [
        "statusId",
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
      ],
      where: { doctorId },
      group: ["statusId"],
    });

    // Tổng số bệnh nhân duy nhất (unique patientId)
    const totalPatients = await db.Booking.count({
      distinct: true,
      col: "patientId",
      where: { doctorId },
    });

    // Bệnh nhân mới (lần đầu khám với bác sĩ này)
    const newPatients = await db.Booking.findAll({
      attributes: [
        "patientId",
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
      ],
      where: { doctorId },
      group: ["patientId"],
      having: db.sequelize.literal("COUNT(id) = 1"), // chỉ lấy bệnh nhân có 1 booking duy nhất
    });

    // Thống kê lịch hẹn theo ngày
    const bookingsByDate = await db.Booking.findAll({
      attributes: [
        [db.sequelize.literal("DATE(FROM_UNIXTIME(`date` / 1000))"), "date"],
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
      ],
      where: {
        doctorId,
        date: { [db.Sequelize.Op.ne]: null }, // bỏ date null
      },
      group: [db.sequelize.literal("DATE(FROM_UNIXTIME(`date` / 1000))")],
      order: [
        [db.sequelize.literal("DATE(FROM_UNIXTIME(`date` / 1000))"), "ASC"],
      ],
      raw: true,
    });

    // Top triệu chứng/ bệnh thường gặp
    const topSymptoms = await db.Booking.findAll({
      attributes: [
        "symptoms",
        [db.sequelize.fn("COUNT", db.sequelize.col("symptoms")), "count"],
      ],
      where: { doctorId },
      group: ["symptoms"],
      order: [[db.sequelize.literal("count"), "DESC"]],
      limit: 5,
    });

    const totalFavorites = await db.Favorite.count({
      where: { doctorId },
    });

    return {
      bookingsByStatus,
      totalPatients,
      newPatients: newPatients.length, // chỉ cần số lượng bệnh nhân mới
      bookingsByDate,
      topSymptoms,
      totalFavorites,
    };
  } catch (error) {
    throw error;
  }
};

const getHospitalStatistics = async (hospitalId) => {
  try {
    const whereCondition = hospitalId ? { hospitalId } : {};

    // Tổng số lịch hẹn theo trạng thái
    const bookingsByStatus = await db.Booking.findAll({
      attributes: [
        "statusId",
        [db.sequelize.fn("COUNT", db.sequelize.col("Booking.id")), "count"],
      ],
      where: whereCondition,
      group: ["statusId"],
      raw: true,
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayAppointments = await db.Booking.count({
      where: {
        ...whereCondition,
        date: {
          [Op.between]: [
            todayStart.getTime(),
            todayEnd.getTime()
          ]
        }
      }
    });

    // Tổng bệnh nhân
    const totalPatients = await db.Booking.count({
      distinct: true,
      col: "patientId",
      where: whereCondition,
    });

    // Tổng bác sĩ
    const totalDoctors = await db.Doctor_Infor.count({
      where: whereCondition,
    });
    // Tổng chuyên khoa của bệnh viện
    const totalSpecialties = await db.Hospital_Specialties.count({
      where: { hospitalId },
    });

    // Booking theo ngày
    const bookingsByDate = await db.Booking.findAll({
      attributes: [
        [
          db.sequelize.literal("DATE(FROM_UNIXTIME(`date`/1000))"),
          "date",
        ],
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
      ],
      where: {
        ...whereCondition,
        date: { [Op.ne]: null },
      },
      group: [db.sequelize.literal("DATE(FROM_UNIXTIME(`date`/1000))")],
      order: [
        [db.sequelize.literal("DATE(FROM_UNIXTIME(`date`/1000))"), "ASC"],
      ],
      raw: true,
    });

    // Top bác sĩ nhiều lịch nhất
    const topDoctors = await db.Booking.findAll({
      attributes: [
        "doctorId",
        [db.sequelize.fn("COUNT", db.sequelize.col("Booking.id")), "totalBookings"],
      ],
      where: whereCondition,
      include: [
        {
          model: db.User,
          as: "infoDataDoctor",
          attributes: ["fullName", "avatar"],
        },
      ],
      group: ["Booking.doctorId"],
      order: [[db.sequelize.literal("totalBookings"), "DESC"]],
      limit: 5,
      raw: true,
      nest: true,
    });

    // Top chuyên khoa nhiều lịch nhất
    const topSpecialties = await db.Booking.findAll({
      attributes: [
        "doctorId",
        [Sequelize.fn("COUNT", Sequelize.col("Booking.id")), "totalBookings"],
      ],
      where: whereCondition,
      include: [
        {
          model: db.Doctor_Infor,
          as: "doctorInfoData",
          include: [
            {
              model: db.Specialty,
              as: "specialty",
              attributes: ["name"],
            },
          ],
        },
      ],
      group: ["doctorId"],
      order: [[db.sequelize.literal("totalBookings"), "DESC"]],
      limit: 5,
      raw: true,
      nest: true,
    });

    return {
      bookingsByStatus,
      totalPatients,
      totalDoctors,
      totalSpecialties,
      todayAppointments,
      bookingsByDate,
      topDoctors,
      topSpecialties,
    };
  } catch (error) {
    console.error("Error in getHospitalStatistics:", error);
    throw error;
  }
};

module.exports = {
  getDoctorStatistics: getDoctorStatistics,
  getHospitalStatistics: getHospitalStatistics,
};
