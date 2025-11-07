import doctorService from "../services/doctorService";

let getTopDoctorHome = async (req, res) => {
    let limit = req.query.limit;
    if(!limit) limit = 10;
    try {
        let response = await doctorService.getTopDoctorHome(+limit);
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            message: 'Error from server...'
        })
    }
}

let getGetAllDoctor = async (req, res) => {
    try {
        let doctors = await doctorService.getAllDoctors();
        return res.status(200).json(doctors)
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getAllDoctorConfig = async (req, res) => {
    try {
        let doctors = await doctorService.getAllDoctorConfig();
        return res.status(200).json(doctors)
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let postInforDoctor = async (req, res) => {
    try {
        let response = await doctorService.saveDetailInforDoctor(req.body);
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getDetailDoctorById = async (req, res) => {
    try {
        let infor = await doctorService.getDetailDoctorByIdService(req.query.id);
        return res.status(200).json(infor);
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let bulkCreateSchedule = async (req, res) => {
    try {
        let infor = await doctorService.bulkCreateScheduleService(req.body);
        return res.status(200).json(infor);
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getScheduleByDate = async (req, res) => {
    try {
        let infor = await doctorService.getScheduleByDateService(req.query.doctorId, req.query.date);
        return res.status(200).json(infor);
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getEtraInforDoctorById = async (req, res) => {
    try {
        let infor = await doctorService.getEtraInforDoctorById(req.query.doctorId);
        return res.status(200).json(infor);
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getProfileDoctorById = async (req, res) => {
    try {
        let infor = await doctorService.getProfileDoctorById(req.query.doctorId);
        return res.status(200).json(infor);
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getListPatientForDoctor = async (req, res) => {
    try {
        let infor = await doctorService.getListPatientForDoctor(req.query.doctorId, req.query.date, req.query.status);
        return res.status(200).json(infor);
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getListBookingApproval = async (req, res) => {
    try {
        let infor = await doctorService.getListBookingApproval(req.query.date, req.query.status);
        return res.status(200).json(infor);
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getListMedicalRecord = async (req, res) => {
    try {
        let infor = await doctorService.getListMedicalRecord(req.query.date, req.query.status);
        return res.status(200).json(infor);
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let updateBookingStatus = async (req, res) => {
  try {
    let data = req.body;
    let infor = await doctorService.updateBookingStatus(data);
    return res.status(200).json(infor);
  } catch (e) {
    console.log(e);
    return res.status(200).json({
      errCode: -1,
      errMessage: "Error from server...",
    });
  }
};

let sendRemedy = async (req, res) => {
    try {
        let infor = await doctorService.sendRemedy(req.body);
        return res.status(200).json(infor);
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let createMedicalRecord = async (req, res) => {
  try {
    const file = req.file ? req.file.buffer : null; // buffer PDF
    const mimeType = req.file ? req.file.mimetype : null;
    const fileName = req.file ? req.file.originalname : null;

    const data = {
      ...req.body,
      file,
      fileMime: mimeType,
      fileName,
    };

    const response = await doctorService.createMedicalRecord(data);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in createMedicalRecord:", error);
    return res.status(500).json({
      errCode: -1,
      errMessage: "Error from server",
    });
  }
};


let getMedicalRecordsByPatient = async (req, res) => {
  try {
    const { patientId } = req.query;
    const response = await doctorService.getMedicalRecordsByPatient(patientId);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in getMedicalRecordsByPatient:", error);
    return res.status(500).json({ errCode: -1, errMessage: "Error from server" });
  }
};
let handleDeleteMedicalRecord = async (req, res) => {
    if(!req.body.id) {
        return res.status(200).json({
            errCode: 1,
            errMessage: "Missing required parameters!"
        })
    }
    let message = await doctorService.handleDeleteMedicalRecord(req.body.id);
    return res.status(200).json(message);
}

module.exports = {
    getTopDoctorHome: getTopDoctorHome,
    getGetAllDoctor: getGetAllDoctor,
    postInforDoctor: postInforDoctor,
    getDetailDoctorById: getDetailDoctorById,
    bulkCreateSchedule: bulkCreateSchedule,
    getScheduleByDate: getScheduleByDate,
    getEtraInforDoctorById: getEtraInforDoctorById,
    getProfileDoctorById: getProfileDoctorById,
    getListPatientForDoctor: getListPatientForDoctor,
    sendRemedy: sendRemedy,
    getAllDoctorConfig: getAllDoctorConfig,
    updateBookingStatus: updateBookingStatus,
    createMedicalRecord: createMedicalRecord,
    getMedicalRecordsByPatient: getMedicalRecordsByPatient,
    handleDeleteMedicalRecord: handleDeleteMedicalRecord,
    getListBookingApproval: getListBookingApproval,
    getListMedicalRecord: getListMedicalRecord
}