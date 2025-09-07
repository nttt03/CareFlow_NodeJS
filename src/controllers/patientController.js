import patientService from '../services/patientService';

let postBookApointment = async (req, res) => {
    try {
        let data = await patientService.postBookApointment(req.body);
        return res.status(200).json(data)
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let postVerifyBookApointment = async (req, res) => {
    try {
        let data = await patientService.postVerifyBookApointment(req.body);
        return res.status(200).json(data)
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server...'
        })
    }
}

let getNewAppointment = async (req, res) => {
    try {
        let data = await patientService.getNewAppointment(req.query.patientId)
        return res.status(200).json(data)
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from service...'
        })
    }
}

let getDoneAppointment = async (req, res) => {
    try {
        let data = await patientService.getDoneAppointment(req.query.patientId)
        return res.status(200).json(data)
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from service...'
        })
    }
}

let getInfoUserById = async (req, res) => {
    try {
        // Nếu có query param thì dùng, không thì lấy từ JWT
        let userId = req.query.patientId || req.user.id;
         if (!userId) {
            return res.status(400).json({
                errCode: 1,
                errMessage: "Missing user id",
            });
        }
        let data = await patientService.getInfoUserById(userId)
        return res.status(200).json(data)
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from service...'
        })
    }
}

const updateInfoByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = req.body;

    const result = await patientService.updateInfoByUser(userId, data);

    if (result.errCode === 0) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Update info by user error:", error);
    return res.status(500).json({
      errCode: -1,
      errMessage: "Lỗi server khi cập nhật thông tin!",
    });
  }
};

module.exports = {
    postBookApointment: postBookApointment,
    postVerifyBookApointment: postVerifyBookApointment,
    getNewAppointment: getNewAppointment,
    getDoneAppointment: getDoneAppointment,
    getInfoUserById: getInfoUserById,
    updateInfoByUser: updateInfoByUser
}