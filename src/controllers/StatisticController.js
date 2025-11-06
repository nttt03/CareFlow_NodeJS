import StatisticService from "../services/StatisticService.js";

let getDoctorStatistics = async (req, res) => {
  try {
    const doctorId = req.params.doctorId; // lấy từ route /api/doctor/:doctorId/statistics

    const stats = await StatisticService.getDoctorStatistics(doctorId);
    return res.status(200).json({
      errCode: 0,
      errMessage: "Get doctor statistics successfully",
      data: stats,
    });
  } catch (error) {
    return res.status(500).json({
      errCode: 1,
      errMessage: "Error while getting doctor statistics",
      error: error.message,
    });
  }
};

let getHospitalStatistics = async (req, res) => {
  try {
    const hospitalId = req.params.hospitalId;

    const stats = await StatisticService.getHospitalStatistics(hospitalId);
    return res.status(200).json({
      errCode: 0,
      errMessage: "Get hospital statistics successfully",
      data: stats,
    });
  } catch (error) {
    return res.status(500).json({
      errCode: 1,
      errMessage: "Error while getting hospital statistics",
      error: error.message,
    });
  }
};

let getAdminStatistics = async (req, res) => {
  try {
    const stats = await StatisticService.getAdminStatistics();
    return res.status(200).json({
      errCode: 0,
      errMessage: "Get admin statistics successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Error in getAdminStatistics controller:", error);
    return res.status(500).json({
      errCode: 1,
      errMessage: "Error while getting admin statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getDoctorStatistics: getDoctorStatistics,
  getHospitalStatistics: getHospitalStatistics,
  getAdminStatistics: getAdminStatistics
};
