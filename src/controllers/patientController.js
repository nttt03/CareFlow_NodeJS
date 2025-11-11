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

let getAppointmentForNoti = async (req, res) => {
    try {
        let data = await patientService.getAppointmentForNoti(req.query.bookingId)
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

let getAppointmentNeedReview = async (req, res) => {
    try {
        let data = await patientService.getAppointmentNeedReview(req.query.patientId)
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

const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { hospitalId, doctorId } = req.body;

    if (!userId || (!hospitalId && !doctorId)) {
      return res.status(400).json({
        errCode: 1,
        message: "Missing required parameters!",
      });
    }

    const result = await patientService.toggleFavoriteService(userId, hospitalId, doctorId);
    return res.status(200).json(result);
  } catch (e) {
    console.error("Error in toggleFavorite:", e);
    return res.status(500).json({ errCode: -1, message: "Server error" });
  }
};

export const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    if (!userId) {
      return res.status(400).json({ errCode: 1, message: "Thiếu userId!" });
    }

    const result = await patientService.getUserFavorites(userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error getUserFavorites controller:", error);
    return res.status(500).json({ errCode: -1, message: "Lỗi server!" });
  }
};

let searchAll = async (req, res) => {
    try {
      const { keyword, provinceId, specialtyId, hospitalId } = req.query;

      const data = await patientService.searchAll({
        keyword,
        provinceId,
        specialtyId,
        hospitalId,
      });

      return res.status(200).json({
        errCode: 0,
        message: "OK",
        data,
      });
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        errCode: -1,
        message: "Error from server",
      });
    }
  }

let handleCreateReview = async (req, res) => {
  try {
    let userId = req.user.id; // từ JWT
    let data = req.body;
    console.log("userId", userId);
    console.log("data", data);
    let response = await patientService.handleCreateReview(userId, data);

    return res.status(200).json({
      errMessage: response.errMessage,
      errCode: response.errCode,
      DT: response.DT || ''
    });

  } catch (e) {
    console.error(e);
    return res.status(200).json({
      errMessage: 'Lỗi từ server!',
      errCode: '-1',
      DT: ''
    });
  }
};

let getReviews = async (req, res) => {
  try {
    const doctorId = req.query.doctorId || null;
    const result = await patientService.getReviewsService(doctorId);
    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errCode: -1,
      message: "Server error",
    });
  }
};

module.exports = {
    postBookApointment: postBookApointment,
    postVerifyBookApointment: postVerifyBookApointment,
    getNewAppointment: getNewAppointment,
    getDoneAppointment: getDoneAppointment,
    getInfoUserById: getInfoUserById,
    updateInfoByUser: updateInfoByUser,
    toggleFavorite: toggleFavorite,
    getUserFavorites: getUserFavorites,
    getAppointmentForNoti: getAppointmentForNoti,
    searchAll: searchAll,
    getAppointmentNeedReview: getAppointmentNeedReview,
    handleCreateReview: handleCreateReview,
    getReviews: getReviews
}