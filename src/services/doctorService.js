import db from '../models/index';
require('dotenv').config();
import _ from "lodash";
import emailService from '../services/emailService';
import notificationService from "../services/notificationService";

const MAX_NUMBER_SCHEDULE = process.env.MAX_NUMBER_SCHEDULE;

let getTopDoctorHome = (limit) => {
    return new Promise(async(resolve, reject) => {
        try {
            let users = await db.User.findAll({
                where: { roleId: 'R2', status: 'A1' },
                attributes: {
                    exclude: ['password', 'resetPasswordExpires', 'resetPasswordToken'],
                    include: [
                        // Dùng literal để COUNT trực tiếp trong subquery
                        [db.sequelize.literal(`(
                            SELECT COUNT(*) 
                            FROM Bookings AS b 
                            WHERE b.doctorId = User.id 
                            AND b.statusId IN ('S2', 'S4')
                        )`), 'bookingCount']
                    ]
                },
                include: [
                    { model: db.Datacode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                    { model: db.Datacode, as: 'genderData', attributes: ['valueEn', 'valueVi'] },
                    {
                        model: db.Doctor_Infor,
                        as: 'doctorInfor',
                        attributes: ['specialtyId', 'rating', 'count'],
                        include: [
                            {
                                model: db.Specialty,
                                as: 'specialty',
                                attributes: ['name']
                            }
                        ]
                    }
                ],
                group: ['User.id'],
                order: [[db.sequelize.literal('bookingCount'), 'DESC']],
                limit: limit,
                raw: true, // Quan trọng: để literal hoạt động đúng
                nest: true
            });

            resolve({
                errCode: 0,
                data: users
            });
        } catch (e) {
            console.log(e);
            reject(e);
        }
    });
};

let getAllDoctors = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let doctors = await db.User.findAll({
        where: { roleId: "R2", status: "A1" },
        attributes: {
          exclude: ["password"],
        },
      });

      if (doctors && doctors.length > 0) {
        doctors = doctors.map((doctor) => {
          if (doctor.avatar) {
            // nếu avatar có dữ liệu mới convert
            doctor.avatar = Buffer.from(doctor.avatar, "base64").toString("binary");
          }
          return doctor;
        });
      }

      resolve({
        errCode: 0,
        data: doctors,
      });
    } catch (e) {
      reject(e);
    }
  });
};

let getAllDoctorConfig = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let doctors = await db.User.findAll({
        where: { roleId: "R2", status: "A1", hospitalId: null },
        attributes: {
          exclude: ["password"],
        },
      });

      if (doctors && doctors.length > 0) {
        doctors = doctors.map((doctor) => {
          if (doctor.avatar) {
            // nếu avatar có dữ liệu mới convert
            doctor.avatar = Buffer.from(doctor.avatar, "base64").toString("binary");
          }
          return doctor;
        });
      }

      resolve({
        errCode: 0,
        data: doctors,
      });
    } catch (e) {
      reject(e);
    }
  });
};

let getAllLeaderHospital = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let leaderHospitals = await db.User.findAll({
        where: { roleId: "R4", status: "A1", hospitalId: null },
        attributes: {
          exclude: ["password"],
        },
      });

      if (leaderHospitals && leaderHospitals.length > 0) {
        leaderHospitals = leaderHospitals.map((leader) => {
          if (leader.avatar) {
            leader.avatar = Buffer.from(leader.avatar, "base64").toString("binary");
          }
          return leader;
        });
      }

      resolve({
        errCode: 0,
        data: leaderHospitals,
      });
    } catch (e) {
      reject(e);
    }
  });
};

let checkRequiredFields = (inputData) => {
    let arrFields = ['doctorId', 'action', 'hospitalId', 'specialtyId']
    let isValid = true;
    let element = '';
    for (let i = 0; i < arrFields.length; i++) {
        if (!inputData[arrFields[i]]) {
            isValid = false;
            element = arrFields[i];
            break;
        }
    }
    return {
        isValid: isValid,
        element: element
    }
}

let saveDetailInforDoctor = (inputData) => {
    return new Promise(async (resolve, reject) => {
        try {
            let checkObj = checkRequiredFields(inputData);
            if(checkObj.isValid === false) {
                resolve({
                    errCode: 1,
                    errMessage: `Thiếu dữ liệu: ${checkObj.element}`
                })
            } else {
                // upsert to markdown
                if(inputData.action === 'CREATE') {
                    await db.Markdown.create({
                        contentHTML: inputData.contentHTML,
                        contentMarkdown: inputData.contentMarkdown,
                        description: inputData.description,
                        doctorId: inputData.doctorId
                    })
                }
                else if(inputData.action === 'EDIT') {
                    let doctorMarkdown = await db.Markdown.findOne({
                        where: {doctorId: inputData.doctorId},
                        raw: false
                    })
                    if(doctorMarkdown) {
                        doctorMarkdown.contentHTML = inputData.contentHTML;
                        doctorMarkdown.contentMarkdown = inputData.contentMarkdown;
                        doctorMarkdown.description = inputData.description;
                        //doctorMarkdown.updateAt = new Date();
                        await doctorMarkdown.save()
                    }
                }

                // upsert to table doctor_infor
                let doctorInfor = await db.Doctor_Infor.findOne({
                    where: {
                        doctorId: inputData.doctorId,
                    },
                    raw: false
                })

                if(doctorInfor) {
                    // update
                    doctorInfor.doctorId = inputData.doctorId;
                    doctorInfor.hospitalId = inputData.hospitalId;
                    doctorInfor.specialtyId = inputData.specialtyId;
                    doctorInfor.price = inputData.price;
                    doctorInfor.note = inputData.note;

                    await doctorInfor.save()    
                } else {
                    // create
                    await db.Doctor_Infor.create({
                        doctorId: inputData.doctorId,
                        hospitalId : inputData.hospitalId,
                        specialtyId : inputData.specialtyId,
                        price : inputData.price,
                        note : inputData.note,

                    })
                }

                let doctorUser = await db.User.findOne({
                    where: { id: inputData.doctorId },
                    raw: false,
                });
                if (doctorUser) {
                    doctorUser.hospitalId = inputData.hospitalId;
                    doctorUser.positionId = inputData.positionId;
                    await doctorUser.save();
                }

                resolve({
                    errCode: 0,
                    errMessage: 'Save doctor success...'
                })
            }
            
        } catch (e) {
            reject(e);
        }
    })
}

let getDetailDoctorByIdService = (inputId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if(!inputId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameter!'
                })
            } else {
                let data = await db.User.findOne({
                    where: {
                        id: inputId
                    },
                    attributes: {
                        exclude: ['password']
                    },
                    include: [ 
                        { 
                            model: db.Markdown, 
                            attributes: ['description', 'contentHTML', 'contentMarkdown'] 
                        },
                        { model: db.Datacode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                        { 
                            model: db.Doctor_Infor, 
                            as: 'doctorInfor',
                            attributes: {
                                exclude: ['id', 'doctorId']
                            },
                            include: [
                                {
                                    model: db.Specialty,
                                    as: 'specialty',
                                    attributes: ['name'] 
                                },
                                { model: db.Hospital, as: 'hospital', attributes: ['name', 'addressDetail', 'provinceId'],
                                    include: [
                                        { model: db.Province, as: 'provinceData', attributes: ['name'] },
                                    ]
                                }
                            ]
                        },
                    ],
                    raw: false,
                    nest: true
                })
                
                if(data && data.image) {
                    data.image = Buffer.from(data.image, 'base64').toString('binary');
                }
                if(!data) { data = {} }

                resolve({
                    errCode: 0,
                    data: data
                })
            }
            
        } catch (e) {
            reject(e);
        }
    })
}

let bulkCreateScheduleService = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if(!data.arrSchedule || !data.doctorId || !data.formatedDate) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameter!'
                })
            } else {
                let schedule = data.arrSchedule;
                if(schedule && schedule.length > 0) {
                    schedule = schedule.map(item => {
                        item.maxNumber = item.maxNumber;
                        return item;
                    })
                }

                // get all exiting data
                let exiting = await db.Schedule.findAll({
                    where: { doctorId: data.doctorId, date: data.formatedDate },
                    attributes: ['timeType', 'date', 'doctorId','maxNumber'],
                    raw: true
                });

                // convert date
                // Vì cột date đã chuyển từ kiểu dl date sang string(TimeStamp unix) nên ko cần convert lại
                // if(exiting && exiting.length > 0) {
                //     exiting = exiting.map(item => {
                //         item.date = new Date(item.date).getTime();
                //         return item;
                //     })
                // }

                // compare different
                let toCreate = _.differenceWith(schedule, exiting, (a, b) => {
                    return a.timeType === b.timeType && +a.date === +b.date;
                });

                // create Data
                if(toCreate && toCreate.length > 0) {
                    await db.Schedule.bulkCreate(toCreate);
                }

                // console.log('data send: ', schedule);
                // console.log('typeOf data send: ', typeof schedule);
                resolve({
                    errCode: 0,
                    errMessage: 'Create schedule successfully'
                });
            }
            
        } catch (e) {
            reject(e);
        }
    })
}

let getScheduleByDateService = async (doctorId, date) => {
    return new Promise(async (resolve, reject) => {
        try {
            if(!doctorId && !date) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters'
                })
            } else {
                let data = await db.Schedule.findAll({
                    where: {
                        doctorId: doctorId,
                        date: date,
                        [db.Sequelize.Op.and]: [
                            db.Sequelize.where(
                                db.Sequelize.col("currentNumber"),
                                "<",
                                db.Sequelize.col("maxNumber")
                            )
                        ]
                    },
                    include: [   
                        { model: db.Datacode, as: 'timeTypeData', attributes: ['valueEn', 'valueVi'] },
                        { model: db.User, as: 'doctorData', attributes: ['fullName'] },
                    ],
                    raw: false,
                    nest: true
                })
                if(!data) data = [];
                resolve({
                    errCode: 0,
                    data: data
                });

            }
        } catch (e) {
            reject(e);
        }
    })
}

let getEtraInforDoctorById = async (doctorId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!doctorId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters'
                })
            } else {
                let data = await db.Doctor_Infor.findOne({
                    where: {
                        doctorId: doctorId
                    },
                    attributes: {
                        exclude: ['id', 'doctorId']
                    },

                    include: [
                        {
                            model: db.Specialty,
                            as: 'specialty',
                            attributes: ['name'] 
                        },
                        { model: db.Hospital, as: 'hospital', attributes: ['name', 'addressDetail', 'provinceId'],
                            include: [
                                { model: db.Province, as: 'provinceData', attributes: ['name'] },
                            ]
                        }
                    ],
                    // include: [
                    //     { model: db.Datacode, as: 'priceTypeData', attributes: ['valueEn', 'valueVi'] },
                    //     { model: db.Datacode, as: 'provinceTypeData', attributes: ['valueEn', 'valueVi'] },
                    //     { model: db.Datacode, as: 'paymentTypeData', attributes: ['valueEn', 'valueVi'] },

                    // ],
                    raw: false,
                    nest: true
                })
                if (!data) data = {};
                resolve({
                    errCode: 0,
                    data: data
                })
            }
            
        } catch (e) {
            reject(e)
        }
    })
}

let getProfileDoctorById = (inputId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!inputId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters'
                })
            } else {
                let data = await db.User.findOne({
                    where: {
                        id: inputId
                    },
                    attributes: {
                        exclude: ['password']
                    },
                    include: [ 
                        { 
                            model: db.Markdown, 
                            attributes: ['description', 'contentHTML', 'contentMarkdown'] 
                        },
                        { model: db.Datacode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                        { 
                            model: db.Doctor_Infor, 
                            as: 'doctorInfor',
                            attributes: {
                                exclude: ['id', 'doctorId']
                            },
                            include: [
                                {
                                    model: db.Specialty,
                                    as: 'specialty',
                                    attributes: ['name'] 
                                }
                            ]
                        },
                    ],
                    raw: false,
                    nest: true
                })
                
                if(data && data.image) {
                    data.image = new Buffer(data.image, 'base64').toString('binary');
                }
                if(!data) { data = {} }

                resolve({
                    errCode: 0,
                    data: data
                })
            }
            
        } catch (e) {
            reject(e)
        }
    })
}

let getListPatientForDoctor = (doctorId, date, status) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!doctorId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameter doctorId'
                })
            } else {

                let whereCondition = {
                    doctorId: doctorId
                };

                if (status) {
                    whereCondition.statusId = status;
                }

                if (date) {
                    whereCondition.date = date;
                }

                let data = await db.Booking.findAll({
                    where: whereCondition,
                    include: [
                        {
                            model: db.User,
                            as: 'patientData',
                            attributes: {
                                exclude: ['password', 'positionId', 'hospitalId', 'avatar', 'resetPasswordExpires', 'resetPasswordToken']
                            },
                            include: [
                                { model: db.Datacode, as: 'genderData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Province, as: 'provinceData', attributes: ['code', 'name'] },
                                { model: db.Patient_Profile, as: 'patientProfile' },
                                { model: db.Medical_Record, as: 'medicalRecords' },
                            ],
                        },
                        {
                            model: db.User,
                            as: 'infoDataDoctor',
                            attributes: {
                                exclude: ['password', 'avatar', 'resetPasswordExpires', 'resetPasswordToken']
                            },
                        },
                        {
                            model: db.Datacode,
                            as: 'timeTypeDataPatient',
                            attributes: ['valueEn', 'valueVi'],
                        }
                    ],
                    raw: false,
                    nest: true
                });

                resolve({
                    errCode: 0,
                    data: data
                });
            }

        } catch (e) {
            reject(e)
        }
    })
}
let getListBookingApproval = (date, status) => {
    return new Promise(async (resolve, reject) => {
        try {
            let whereCondition = {
                    statusId: status
                };

                if (date) {
                    whereCondition.date = date;
                }

                let data = await db.Booking.findAll({
                    where: whereCondition,
                    include: [
                        {
                            model: db.User,
                            as: 'patientData',
                            attributes: {
                                exclude: ['password', 'positionId', 'hospitalId', 'avatar']
                            },
                            include: [
                                { model: db.Datacode, as: 'genderData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Province, as: 'provinceData', attributes: ['code', 'name'] },
                                { model: db.Patient_Profile, as: 'patientProfile' },
                                { model: db.Medical_Record, as: 'medicalRecords' },
                            ],
                        },
                        {
                            model: db.Datacode,
                            as: 'timeTypeDataPatient',
                            attributes: ['valueEn', 'valueVi'],
                        }
                    ],
                    raw: false,
                    nest: true
                });

                resolve({
                    errCode: 0,
                    data: data
                });

        } catch (e) {
            reject(e)
        }
    })
}

let getListMedicalRecord = (date, status) => {
    return new Promise(async (resolve, reject) => {
        try {
            let whereCondition = {
                    statusId: status
                };

                if (date) {
                    whereCondition.date = date;
                }

                let data = await db.Booking.findAll({
                    where: whereCondition,
                    include: [
                        {
                            model: db.User,
                            as: 'patientData',
                            attributes: {
                                exclude: ['password', 'positionId', 'hospitalId', 'avatar']
                            },
                            include: [
                                { model: db.Datacode, as: 'genderData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Province, as: 'provinceData', attributes: ['code', 'name'] },
                                { model: db.Patient_Profile, as: 'patientProfile' },
                                { model: db.Medical_Record, as: 'medicalRecords' },
                            ],
                        },
                        {
                            model: db.Datacode,
                            as: 'timeTypeDataPatient',
                            attributes: ['valueEn', 'valueVi'],
                        }
                    ],
                    raw: false,
                    nest: true
                });

                resolve({
                    errCode: 0,
                    data: data
                });

        } catch (e) {
            reject(e)
        }
    })
}

let updateBookingStatus = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      let { bookingId, status, rejectReason } = data;

      if (!bookingId || !status) {
        return resolve({
          errCode: 1,
          errMessage: "Missing required parameters: bookingId or status",
        });
      }

      if (status === "S5" && (!rejectReason || !rejectReason.trim())) {
        return resolve({
          errCode: 1,
          errMessage: "Lý do hủy là bắt buộc khi hủy lịch hẹn",
        });
      }

      let booking = await db.Booking.findOne({
        where: { id: bookingId },
        raw: false,
        include: [
          {
            model: db.User,
            as: "patientData",
            attributes: ["id", "fullName"],
          },
          {
            model: db.User,
            as: "infoDataDoctor",
            attributes: ["id", "fullName"],
          },
        ],
      });

      if (!booking) {
        return resolve({
          errCode: 2,
          errMessage: "Booking not found",
        });
      }

      booking.statusId = status;
      if (status === "S5" && rejectReason) {
        booking.rejectReason = rejectReason.trim();
      }

      await booking.save();

      // Nếu huỷ lịch -> trừ currentNumber trong Schedule
        if (status === "S5") {
        let schedule = await db.Schedule.findOne({
            where: {
            doctorId: booking.doctorId,
            date: booking.date,
            timeType: booking.timeType,
            },
            raw: false
        });

        if (schedule) {
            // Tránh currentNumber < 0
            schedule.currentNumber = Math.max((schedule.currentNumber || 0) - 1, 0);
            await schedule.save();
        }
        }

      if (booking.patientData && booking.patientData.id) {
        let message = "";
        let url = `/view-appointment/${bookingId}`;

        switch (status) {
          case "S2":
            message = `Lịch hẹn của bạn với bác sĩ ${booking.infoDataDoctor.fullName} đã được xác nhận.`;
            break;
          case "S3":
            message = `Lịch hẹn với bác sĩ ${booking.infoDataDoctor.fullName} đang được khám.`;
            break;
          case "S4":
            message = `Lịch hẹn của bạn với bác sĩ ${booking.infoDataDoctor.fullName} đã hoàn thành.`;
            break;
          case "S5":
            message = `Lịch hẹn của bạn với bác sĩ ${booking.infoDataDoctor.fullName} đã bị hủy.`;
            break;
          default:
            message = `Lịch hẹn của bạn vừa được cập nhật trạng thái.`;
            break;
        }

        await notificationService.createNotification({
          senderId: booking.infoDataDoctor.id,
          receiverId: booking.patientData.id,
          receiverRole: "R3",
          message: message,
          url: url,
          idBooking: bookingId
        });
      }

      return resolve({
        errCode: 0,
        errMessage: "Cập nhật trạng thái lịch hẹn thành công",
        data: booking,
      });
    } catch (e) {
      reject(e);
    }
  });
};


let sendRemedy = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.email || !data.doctorId || !data.patientId || !data.timeType || !data.imgBase64) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters'
                })
            } else {
                // update patient status
                let appointment = await db.Booking.findOne({
                    where: {
                        doctorId: data.doctorId,
                        patientId: data.patientId,
                        timeType: data.timeType,
                        statusId: 'S2'
                    },
                    raw: false
                })

                if (appointment) {
                    let url = `/view-appointment/${data.bookingId}`;
                    appointment.statusId = 'S4'
                    await appointment.save()
                    await notificationService.createNotification({
                        senderId: data.doctorId,
                        receiverId: data.patientId,
                        receiverRole: "R3",
                        message: `Lịch hẹn của bạn với bác sĩ ${data.doctorName} đã hoàn thành.`,
                        url: url,
                        idBooking: data.bookingId
                    });
                    await notificationService.sendReviewReminders()
                }

                // send email remedy
                await emailService.sendAttachment(data)
                
                resolve({
                    errCode: 0,
                    errMessage: 'Send remedy successfully'
                })
            }
            
        } catch (e) {
            reject(e)
        }
    })
}

// const createMedicalRecord = async (data) => {
//   const t = await db.sequelize.transaction();
//   try {
//     const {
//       patientId,
//       doctorId,
//       bookingId,
//       description,
//       file,
//       updateBy,
//       height,
//       weight,
//       underlying_diseases,
//       allergies,
//       medical_history,
//     } = data;
// console.log("👉 Received data:", data);
// console.log("patientId:", patientId, "doctorId:", doctorId, "bookingId:", bookingId);

//     if (!patientId || !doctorId || !bookingId) {
//       await t.rollback();
//       return { errCode: 1, errMessage: "Missing required parameters!" };
//     }

//     // 1. Upsert Patient_Profile
//     const existingProfile = await db.Patient_Profile.findOne({
//       where: { userId: patientId },
//       transaction: t,
//     });

//     if (existingProfile) {
//       await existingProfile.update(
//         {
//           height: height ?? existingProfile.height,
//           weight: weight ?? existingProfile.weight,
//           underlying_diseases:
//             underlying_diseases ?? existingProfile.underlying_diseases,
//           allergies: allergies ?? existingProfile.allergies,
//           medical_history: medical_history ?? existingProfile.medical_history,
//         },
//         { transaction: t }
//       );
//     } else {
//       await db.Patient_Profile.create(
//         {
//           userId: patientId,
//           height: height ?? null,
//           weight: weight ?? null,
//           underlying_diseases: underlying_diseases ?? null,
//           allergies: allergies ?? null,
//           medical_history: medical_history ?? null,
//         },
//         { transaction: t }
//       );
//     }

//     // 2. Tạo Medical_Record
//     const record = await db.Medical_Record.create(
//       {
//         patientId,
//         doctorId,
//         bookingId,
//         description,
//         file: file || null,
//         updateBy: updateBy || doctorId,
//       },
//       { transaction: t }
//     );

//     await t.commit();

//     return { errCode: 0, message: "Create medical record success", record };
//   } catch (error) {
//     await t.rollback();
//     console.error("Error createMedicalRecord:", error);
//     return { errCode: -1, errMessage: "Error from server" };
//   }
// };

let createMedicalRecord = async (data) => {
  const t = await db.sequelize.transaction();
  try {
    const {
      patientId,
      doctorId,
      bookingId,
      description,
      file,
      fileMime,
      fileName,
      updateBy,
      height,
      weight,
      underlying_diseases,
      allergies,
      medical_history,
    } = data;

    if (!patientId || !doctorId || !bookingId) {
      await t.rollback();
      return { errCode: 1, errMessage: "Missing required parameters!" };
    }

    // Update hoặc tạo Patient_Profile
    const existingProfile = await db.Patient_Profile.findOne({
      where: { userId: patientId },
      transaction: t,
      raw: false,
    });

    if (existingProfile) {
      await existingProfile.update(
        {
          height: height ?? existingProfile.height,
          weight: weight ?? existingProfile.weight,
          underlying_diseases: underlying_diseases ?? existingProfile.underlying_diseases,
          allergies: allergies ?? existingProfile.allergies,
          medical_history: medical_history ?? existingProfile.medical_history,
        },
        { transaction: t }
      );
    } else {
      await db.Patient_Profile.create(
        {
          userId: patientId,
          height,
          weight,
          underlying_diseases,
          allergies,
          medical_history,
        },
        { transaction: t }
      );
    }

    // Kiểm tra Medical_Record với bookingId
    let record = await db.Medical_Record.findOne({
      where: { bookingId },
      transaction: t,
      raw: false,
    });

    let action = "created";

    if (record) {
      await record.update(
        {
          patientId,
          doctorId,
          description,
          file,
          fileMime,
          fileName,
          updateBy: updateBy || doctorId,
        },
        { transaction: t }
      );
      action = "updated";
    } else {
      record = await db.Medical_Record.create(
        {
          patientId,
          doctorId,
          bookingId,
          description,
          file,
          fileMime,
          fileName,
          updateBy: updateBy || doctorId,
        },
        { transaction: t }
      );
    }

    await t.commit();
    return { errCode: 0, message: `Medical record ${action} successfully`, action, record };
  } catch (error) {
    await t.rollback();
    console.error("Error create/UpdateMedicalRecord:", error);
    return { errCode: -1, errMessage: "Error from server" };
  }
};


const getMedicalRecordsByPatient = async (patientId) => {
  try {
    if (!patientId) return { errCode: 1, errMessage: "Missing patientId" };

    const records = await db.Medical_Record.findAll({
      where: { patientId },
      include: [
        { model: db.User, as: "doctor", attributes: ["id", "fullName", "positionId"] },
        { model: db.Booking, as: "booking", attributes: ["id", "date", "timeType"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return { errCode: 0, records };
  } catch (error) {
    console.error("Error getMedicalRecordsByPatient:", error);
    return { errCode: -1, errMessage: "Error from server" };
  }
};

let handleDeleteMedicalRecord = (medicalRecordId) => {
  return new Promise(async (resolve, reject) => {
    let medicalRecord = await db.Medical_Record.findOne({
      where: { id: medicalRecordId },
      raw: false,
    });
    if (!medicalRecord) {
      resolve({
        errCode: 2,
        errMessage: `The medicalRecord isn't exist`,
      });
    }

    await medicalRecord.destroy();
    resolve({
      errCode: 0,
      errMessage: `Delete medicalRecord success`,
    });
  });
};

module.exports = {
    getTopDoctorHome: getTopDoctorHome,
    getAllDoctors: getAllDoctors,
    saveDetailInforDoctor: saveDetailInforDoctor,
    getDetailDoctorByIdService: getDetailDoctorByIdService,
    bulkCreateScheduleService: bulkCreateScheduleService,
    getScheduleByDateService: getScheduleByDateService,
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
    getListMedicalRecord: getListMedicalRecord,
    getAllLeaderHospital: getAllLeaderHospital
}