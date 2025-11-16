import specialtyService from '../services/specialtyService.js';

let createSpecialty = async (req, res) => {
    try {
        let data = await specialtyService.createSpecialty(req.body);
        return res.status(200).json(data)
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getAllSpecialty = async (req, res) => {
    try {
        let { page, limit, name, status } = req.query;
        page = +page || 1;
        limit = +limit || 10;
        let data = await specialtyService.getAllSpecialty(
            page,
            limit,
            name,
            status
        );
        return res.status(200).json(data)
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getDetailSpecialtyById = async (req, res) => {
    try {
        let data = await specialtyService.getDetailSpecialtyById(req.query.id, req.query.location);
        return res.status(200).json(data)
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getDetailSpecialty = async (req, res) => {
    try {
        let data = await specialtyService.getDetailSpecialty(req.query.id);
        return res.status(200).json(data)
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let updateSpecialtyById = async (req, res) => {
  try {
    let data = await specialtyService.updateSpecialtyById(req.body);
    return res.status(200).json(data);
  } catch (e) {
    console.log("Update Specialty error:", e);
    return res.status(500).json({
      errCode: -1,
      errMessage: "Error from server...",
    });
  }
};

let deleteSpecialtyById = async (req, res) => {
  try {
    let id = req.body.id;
    if (!id) {
      return res.status(400).json({
        errCode: 1,
        errMessage: "Missing required parameter: id",
      });
    }

    let result = await specialtyService.deleteSpecialtyById(id);
    return res.status(200).json(result);
  } catch (e) {
    console.error("Error in deleteSpecialtyById:", e);
    return res.status(500).json({
      errCode: -1,
      errMessage: "Error from server",
    });
  }
};


export default {
    createSpecialty: createSpecialty,
    getAllSpecialty: getAllSpecialty,
    getDetailSpecialtyById: getDetailSpecialtyById,
    getDetailSpecialty: getDetailSpecialty,
    updateSpecialtyById: updateSpecialtyById,
    deleteSpecialtyById: deleteSpecialtyById
}