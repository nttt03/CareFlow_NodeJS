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

const getAdminStatistics = async () => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Tổng quan hệ thống
    const totalHospitals = await db.Hospital.count();
    const totalDoctors = await db.Doctor_Infor.count();
    const totalPatients = await db.User.count({
      where: { roleId: "R3" },
    });
    const totalBookings = await db.Booking.count();
    const todayBookings = await db.Booking.count({
      where: {
        date: {
          [Op.between]: [todayStart.getTime(), todayEnd.getTime()],
        },
      },
    });

    // 2. Lịch hẹn theo trạng thái (toàn hệ thống)
    const bookingsByStatus = await db.Booking.findAll({
      attributes: [
        "statusId",
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
      ],
      group: ["statusId"],
      raw: true,
    });

    // 3. Lịch hẹn theo 7 ngày gần nhất
    const last7DaysBookings = await db.Booking.findAll({
      attributes: [
        [db.sequelize.fn("DATE", db.sequelize.literal("FROM_UNIXTIME(`date`/1000)")), "date"],
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
      ],
      where: {
        date: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime(),
        },
      },
      group: [db.sequelize.fn("DATE", db.sequelize.literal("FROM_UNIXTIME(`date`/1000)"))],
      order: [[db.sequelize.literal("date"), "ASC"]],
      raw: true,
    });

    // 4. Top 5 bệnh viện có nhiều lịch hẹn nhất
    const topHospitals = await db.Booking.findAll({
      attributes: [
        "hospitalId",
        [db.sequelize.fn("COUNT", db.sequelize.col("Booking.id")), "totalBookings"],
      ],
      include: [
        {
          model: db.Hospital,
          as: "hospitalData",
          attributes: ["name", "image"],
        },
      ],
      group: ["hospitalId"],
      order: [[db.sequelize.literal("totalBookings"), "DESC"]],
      limit: 5,
      raw: true,
      nest: true,
    });

    // 5. Top 5 chuyên khoa toàn hệ thống
    const topSpecialties = await db.Booking.findAll({
      attributes: [
        [db.sequelize.col("doctorInfoData.specialty.name"), "specialtyName"],
        [db.sequelize.fn("COUNT", db.sequelize.col("Booking.id")), "totalBookings"],
      ],
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
      group: [db.sequelize.col("doctorInfoData.specialty.name")],
      order: [[db.sequelize.literal("totalBookings"), "DESC"]],
      limit: 5,
      raw: true,
      nest: true,
    });

    // 6. Top 5 bác sĩ toàn hệ thống
    const topDoctors = await db.Booking.findAll({
      attributes: [
        "doctorId",
        [db.sequelize.fn("COUNT", db.sequelize.col("Booking.id")), "totalBookings"],
      ],
      include: [
        {
          model: db.User,
          as: "infoDataDoctor",
          attributes: ["fullName", "avatar"],
        },
      ],
      group: ["doctorId"],
      order: [[db.sequelize.literal("totalBookings"), "DESC"]],
      limit: 5,
      raw: true,
      nest: true,
    });

    return {
      overview: {
        totalHospitals,
        totalDoctors,
        totalPatients,
        totalBookings,
        todayBookings,
      },
      bookingsByStatus,
      last7DaysBookings: last7DaysBookings.map(item => ({
        date: item.date,
        count: Number(item.count),
      })),
      topHospitals: topHospitals.map(h => ({
        hospitalName: h.hospitalData?.name || "Unknown",
        hospitalImg: h.hospitalData?.image,
        totalBookings: Number(h.totalBookings),
      })),
      topSpecialties: topSpecialties.map(s => ({
        specialtyName: s.specialtyName || "Unknown",
        totalBookings: Number(s.totalBookings),
      })),
      topDoctors: topDoctors.map(d => ({
        doctorName: d.infoDataDoctor?.fullName || "Unknown",
        avatar: d.infoDataDoctor?.avatar,
        totalBookings: Number(d.totalBookings),
      })),
    };
  } catch (error) {
    console.error("Error in getAdminStatistics service:", error);
    throw error;
  }
};

module.exports = {
  getDoctorStatistics: getDoctorStatistics,
  getHospitalStatistics: getHospitalStatistics,
  getAdminStatistics: getAdminStatistics
};
