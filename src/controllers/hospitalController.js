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

module.exports = {
    createHospital: createHospital,
    getAllHospital: getAllHospital,
    getAllHospitalByAdmin: getAllHospitalByAdmin,
    getDetailHospitalById: getDetailHospitalById,
    updateHospitalById: updateHospitalById
}