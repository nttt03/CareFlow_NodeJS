import { includes } from 'lodash';
import db from '../models/index';
import emailService from '../services/emailService';
import { v4 as uuidv4 } from 'uuid';
require('dotenv').config();

let buildUrlEmail = (doctorId, token) => {
    let result = `${process.env.URL_REACT}/verify-booking?token=${token}&doctorId=${doctorId}`
    return result;
}

let postBookApointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.email || !data.doctorId || !data.date || !data.timeType || !data.fullName || !data.selectedGender || !data.address) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter...'
                })
            } else {
                let token = uuidv4(); // 1e8fbb8b-cd0a-4a9f-bda6-24a508bb43f8
                // gửi mail
                await emailService.sendSimpleEmail({
                    receiverEmail: data.email,
                    patientName: data.fullName,
                    time: data.timeString,
                    doctorName: data.doctorName,
                    language: data.language,
                    redirectLink: buildUrlEmail(data.doctorId, token)
                });

                // upsert patient
                let user = await db.User.findOrCreate({
                    where: { email: data.email },
                    defaults: {
                        email: data.email,
                        roleId: 'R3',
                        gender: data.selectedGender,
                        address: data.address,
                        firstName: data.fullName,
                    }
                });
                // vì findOrCreate mặc định trả về 1 mảng gồm [object, created]
                // object: dl user lấy về, created: true/false để biết user đã tồn tại hay chưa
                // user[0] là object, user[1] là created
                console.log('>>> check user: ', user[0]);

                // create a booking record
                if (user && user[0]) {
                    await db.Booking.findOrCreate({
                        where: {
                            patientId: user[0].id,
                            doctorId: data.doctorId,
                            date: data.date,
                            timeType: data.timeType
                        },
                        defaults: {
                            statusId: 'S1',
                            doctorId: data.doctorId,
                            patientId: user[0].id,
                            date: data.date,
                            timeType: data.timeType,
                            token: token
                        }

                    })
                }

                resolve({
                    errCode: 0,
                    errMessage: 'Save booking successfully',
                })
            }
        } catch (e) {
            reject(e)
        }
    })
}

let postVerifyBookApointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.token || !data.doctorId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters',
                })
            } else {
                let appointment = await db.Booking.findOne({
                    where: {
                        token: data.token,
                        doctorId: data.doctorId,
                        statusId: 'S1'
                    },
                    // để raw: false (nó sẽ trả ra 1 sequelize object) thì mới dùng được hàm update (appointment.save())
                    // trong file config.json để raw: true (nó sẽ trả ra 1 object của javascript)
                    raw: false
                })

                if (appointment) {
                    // update status (gán dl trước r mới dùng được hàm update)
                    appointment.statusId = 'S2'
                    await appointment.save()

                    resolve({
                        errCode: 0,
                        errMessage: 'Xác nhận lịch hẹn thành công!',
                    })
                } else {
                    resolve({
                        errCode: 2,
                        errMessage: 'Lịch hẹn đã được xác nhận hoặc không tồn tại!',
                    })
                }
            }
        } catch (e) {
            reject(e)
        }
    })
}

let getNewAppointment = (inputId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!inputId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters patientId',
                })
            } else {
                let appointments = await db.Booking.findAll({
                    where: {
                        patientId: inputId,
                        statusId: { [db.Sequelize.Op.in]: ['S1', 'S2'] } // Lọc statusId là 'S1' hoặc 'S2'
                    },
                    attributes: ['statusId', 'patientId', 'date', 'timeType'],
                    include: [
                        {
                            model: db.Doctor_Infor,
                            as: 'doctorInfoData',
                            attributes: ['doctorId', 'addressClinic', 'nameClinic', 'priceId'],
                            include: [
                                { model: db.Allcode, as: 'priceTypeData', attributes: ['valueEn', 'valueVi'] }
                            ]
                        },
                        {
                            model: db.User,
                            as: 'infoDataDoctor',
                            attributes: ['firstName', 'lastName'],
                            include: [
                                { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] }
                            ]
                        },
                        { model: db.Allcode, as: 'timeTypeDataPatient', attributes: ['valueEn', 'valueVi'] },
                        { model: db.Allcode, as: 'statusData', attributes: ['valueEn', 'valueVi'] }
                    ],
                    raw: true,
                    nest: true,
                })
                resolve({
                    errCode: 0,
                    dataAppointments: appointments
                })
            }

        } catch (e) {
            reject(e)
        }
    })
}

let getDoneAppointment = (inputId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!inputId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters patientId',
                })
            } else {
                let appointments = await db.Booking.findAll({
                    where: {
                        patientId: inputId,
                        statusId: 'S3'
                    },
                    attributes: ['statusId', 'patientId', 'date', 'timeType'],
                    include: [
                        {
                            model: db.Doctor_Infor,
                            as: 'doctorInfoData',
                            attributes: ['doctorId', 'addressClinic', 'nameClinic', 'priceId'],
                            include: [
                                { model: db.Allcode, as: 'priceTypeData', attributes: ['valueEn', 'valueVi'] }
                            ]
                        },
                        {
                            model: db.User,
                            as: 'infoDataDoctor',
                            attributes: ['firstName', 'lastName'],
                            include: [
                                { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] }
                            ]
                        },
                        { model: db.Allcode, as: 'timeTypeDataPatient', attributes: ['valueEn', 'valueVi'] },
                        { model: db.Allcode, as: 'statusData', attributes: ['valueEn', 'valueVi'] }
                    ],
                    raw: true,
                    nest: true,
                })
                resolve({
                    errCode: 0,
                    dataAppointments: appointments
                })
            }

        } catch (e) {
            reject(e)
        }
    })
}

// sendAppointmentReminder
let sendAppointmentReminder = () => {
    return new Promise(async (resolve, reject) => {
        try {
            // Calculate the date for tomorrow
            // const tomorrow = new Date();
            // tomorrow.setDate(tomorrow.getDate() + 1);
            // const tomorrowString = tomorrow.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            const { Op } = db.Sequelize;

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Tính timestamp đầu ngày và cuối ngày của ngày mai
            const startOfDay = new Date(tomorrow.setHours(0, 0, 0, 0)).getTime(); // 00:00
            const endOfDay = new Date(tomorrow.setHours(23, 59, 59, 999)).getTime(); // 23:59

            // Find confirmed appointments for tomorrow
            let appointments = await db.Booking.findAll({
                where: {
                    // statusId: 'S2', // Confirmed appointments
                    // date: tomorrowString, // Appointments for tomorrow
                    statusId: 'S2',
                    date: {
                        [Op.between]: [startOfDay, endOfDay],
                    }
                },
                attributes: ['patientId', 'doctorId', 'date', 'timeType'],
                include: [
                    {
                        model: db.User,
                        as: 'patientData',
                        // attributes: ['email', 'firstName', 'language'],
                        attributes: ['email', 'firstName'],
                    },
                    {
                        model: db.User,
                        as: 'infoDataDoctor',
                        attributes: ['firstName', 'lastName'],
                        include: [
                            { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] }
                        ]
                    },
                    {
                        model: db.Doctor_Infor,
                        as: 'doctorInfoData',
                        attributes: ['addressClinic', 'nameClinic'],
                    },
                    {
                        model: db.Allcode,
                        as: 'timeTypeDataPatient',
                        attributes: ['valueEn', 'valueVi'],
                    },
                ],
                raw: true,
                nest: true,
            });

            if (appointments && appointments.length > 0) {
                // Send reminder email for each appointment
                for (let appointment of appointments) {
                    await emailService.sendReminderEmail({
                        receiverEmail: appointment.patientData.email,
                        patientName: appointment.patientData.firstName,
                        time: appointment.timeTypeDataPatient.valueVi || appointment.timeTypeDataPatient.valueEn,
                        doctorName: `${appointment.infoDataDoctor.positionData.valueVi || appointment.infoDataDoctor.positionData.valueEn} ${appointment.infoDataDoctor.firstName} ${appointment.infoDataDoctor.lastName}`,
                        clinicAddress: appointment.doctorInfoData.addressClinic,
                        // language: appointment.patientData.language || 'vi',
                        language: 'vi', // hoặc 'en' nếu mặc định gửi tiếng Anh
                    });
                }

                resolve({
                    errCode: 0,
                    errMessage: 'Reminder emails sent successfully',
                    count: appointments.length,
                });
            } else {
                resolve({
                    errCode: 0,
                    errMessage: 'No appointments found for tomorrow',
                    count: 0,
                });
            }
        } catch (e) {
            reject(e);
        }
    });
};

let getInfoUserById = (inputId) => {
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
                            model: db.Province,
                            as: "provinceData",
                            attributes: ["id", "code", "name"]
                        },
                        {
                            model: db.CommuneUnit,
                            as: "communeUnitData",
                            attributes: ["id", "code", "name", "type"]
                        },
                        {
                            model: db.Datacode,
                            as: "genderData",
                            attributes: ["valueEn", "valueVi"]
                        },
                    ],
                    raw: false,
                    nest: true
                })
                
                if(data && data.avatar) {
                    data.avatar = Buffer.from(data.avatar, 'base64').toString('binary');
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

module.exports = {
    postBookApointment: postBookApointment,
    postVerifyBookApointment: postVerifyBookApointment,
    getNewAppointment: getNewAppointment,
    getDoneAppointment: getDoneAppointment,
    sendAppointmentReminder: sendAppointmentReminder,
    getInfoUserById: getInfoUserById
}