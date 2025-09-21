import hospitalService from '../services/hospitalService'

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

module.exports = {
    createHospital: createHospital,
    getAllHospital: getAllHospital,
    getAllHospitalByAdmin: getAllHospitalByAdmin,
    getDetailHospitalById: getDetailHospitalById,
    updateHospitalById: updateHospitalById,
    deleteHospitalById: deleteHospitalById,
    saveSpecialtiesForHospital: saveSpecialtiesForHospital,
    getSpecialtiesByHospital: getSpecialtiesByHospital
}