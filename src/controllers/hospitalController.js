import hospitalService from '../services/hospitalService.js'

let createHospital = async (req, res) => {
    try {
        let data = await hospitalService.createHospital(req.body);
        return res.status(200).json(data)
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getAllHospital = async (req, res) => {
    try {
        let data = await hospitalService.getAllHospital();
        return res.status(200).json(data)
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getAllHospitalByAdmin = async (req, res) => {
    try {
        let { page, limit, name, provinceId, status } = req.query;
        page = +page || 1;
        limit = +limit || 10;

        let data = await hospitalService.getAllHospitalByAdmin(
            page,
            limit,
            name,
            provinceId,
            status
        );

        return res.status(200).json(data);
    } catch (e) {
        console.error("Error in getAllHospitalByAdmin controller:", e);
        return res.status(200).json({
            errCode: -1,
            errMessage: "Error from server...",
        });
    }
};

let getAllHospitalByPatient = async (req, res) => {
    try {
        let { page, limit, name, provinceId, status } = req.query;
        page = +page || 1;
        limit = +limit || 10;

        let data = await hospitalService.getAllHospitalByPatient(
            page,
            limit,
            name,
            provinceId,
            status
        );

        return res.status(200).json(data);
    } catch (e) {
        console.error("Error in getAllHospitalByPatient controller:", e);
        return res.status(200).json({
            errCode: -1,
            errMessage: "Error from server...",
        });
    }
};

let getDetailHospitalById = async (req, res) => {
    try {
        let data = await hospitalService.getDetailHospitalById(req.query.id);
        return res.status(200).json(data)
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let updateHospitalById = async (req, res) => {
  try {
    let data = await hospitalService.updateHospitalById(req.body);
    return res.status(200).json(data);
  } catch (e) {
    console.log("Update hospital error:", e);
    return res.status(500).json({
      errCode: -1,
      errMessage: "Error from server...",
    });
  }
};

let deleteHospitalById = async (req, res) => {
  try {
    let id = req.body.id;
    if (!id) {
      return res.status(400).json({
        errCode: 1,
        errMessage: "Missing required parameter: id",
      });
    }

    let result = await hospitalService.deleteHospitalById(id);
    return res.status(200).json(result);
  } catch (e) {
    console.error("Error in deleteHospitalById:", e);
    return res.status(500).json({
      errCode: -1,
      errMessage: "Error from server",
    });
  }
};

const saveSpecialtiesForHospital = async (req, res) => {
  const { hospitalId, specialtyIds } = req.body;

  const result = await hospitalService.saveHospitalSpecialties(hospitalId, specialtyIds);

  if (result.errCode === 0) {
    return res.status(200).json(result);
  } else {
    return res.status(400).json(result);
  }
};

const getSpecialtiesByHospital = async (req, res) => {
  const { hospitalId } = req.params;

  if (!hospitalId) {
    return res.status(400).json({ errCode: 1, message: "Hospital ID không hợp lệ" });
  }

  try {
    const specialties = await hospitalService.getSpecialtiesByHospital(hospitalId);
    return res.status(200).json({ errCode: 0, data: specialties });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ errCode: 2, message: "Lỗi khi lấy chuyên khoa" });
  }
};

const getDoctorsByHospital = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    if (!hospitalId) {
      return res.status(400).json({
        errCode: 1,
        message: "Missing hospitalId",
      });
    }

    const doctors = await hospitalService.getDoctorsByHospital(hospitalId);

    return res.status(200).json({
      errCode: 0,
      message: "Get doctors successfully",
      data: doctors,
    });
  } catch (error) {
    console.error("Error getDoctorsByHospital:", error);
    return res.status(500).json({
      errCode: 2,
      message: "Server error",
    });
  }
};

const saveDoctorsForHospital = async (req, res) => {
  try {
    const { hospitalId, doctorIds } = req.body;

    if (!hospitalId || !doctorIds || !Array.isArray(doctorIds)) {
      return res.status(400).json({
        errCode: 1,
        message: "Missing hospitalId or doctorIds",
      });
    }

    const result = await hospitalService.saveDoctorsForHospitalService(hospitalId, doctorIds);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error hospitalController.saveDoctorsForHospital:", error);
    return res.status(500).json({
      errCode: -1,
      message: "Error from server",
    });
  }
};

let saveLeaderForHospital = async (req, res) => {
  try {
    const { hospitalId, leaderId } = req.body;

    if (!hospitalId || !leaderId) {
      return res.status(400).json({
        errCode: 1,
        message: "Missing hospitalId or leaderId",
      });
    }

    const result = await hospitalService.saveLeaderForHospitalService(hospitalId, leaderId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error hospitalController.saveLeaderForHospital:", error);
    return res.status(500).json({
      errCode: -1,
      message: "Error from server",
    });
  }
};

let savePriceForHospital = async (req, res) => {
  try {
    const { hospitalId, specialtyId, price } = req.body;

    if (!hospitalId || !specialtyId) {
      return res.status(400).json({
        errCode: 1,
        errMessage: "Missing required parameters!",
      });
    }

    let response = await hospitalService.savePriceForHospitalService({
      hospitalId,
      specialtyId,
      price,
    });

    return res.status(200).json(response);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errCode: -1,
      errMessage: "Server error!",
    });
  }
};

export default {
    createHospital: createHospital,
    getAllHospital: getAllHospital,
    getAllHospitalByAdmin: getAllHospitalByAdmin,
    getDetailHospitalById: getDetailHospitalById,
    updateHospitalById: updateHospitalById,
    deleteHospitalById: deleteHospitalById,
    saveSpecialtiesForHospital: saveSpecialtiesForHospital,
    getSpecialtiesByHospital: getSpecialtiesByHospital,
    getDoctorsByHospital: getDoctorsByHospital,
    saveDoctorsForHospital: saveDoctorsForHospital,
    savePriceForHospital: savePriceForHospital,
    saveLeaderForHospital: saveLeaderForHospital,
    getAllHospitalByPatient: getAllHospitalByPatient
}