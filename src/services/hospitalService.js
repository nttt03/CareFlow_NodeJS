import db from '../models/index';
const { Op } = require("sequelize");

let createHospital = (data) => {
    return new Promise(async(resolve, reject) => {
        try {
            if (!data.name || !data.addressDetail || !data.provinceId || !data.imageBase64 || !data.descriptionHTML || !data.descriptionMarkdown) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter...'
                })
            } else {
                await db.Hospital.create({
                    name: data.name,
                    addressDetail: data.addressDetail,
                    provinceId: data.provinceId,
                    image: data.imageBase64,
                    descriptionHTML: data.descriptionHTML,
                    descriptionMarkdown: data.descriptionMarkdown,
                    status: "A1"
                })
                resolve({
                    errCode: 0,
                    errMessage: 'Create Hospital successfully'
                })
            }
            
        } catch (e) {
            reject(e)
        }
    })
}

let getAllHospital = () => {
    return new Promise(async(resolve, reject) => {
        try {
            let data = await db.Hospital.findAll();
            if (data && data.length > 0) {
                data.map(item => {
                    item.image = Buffer.from(item.image, 'base64').toString('binary');
                    return item;
                })
            }
            resolve({
                errCode: 0,
                errMessage: 'Get all hospital successfully',
                data
            })
        } catch (e) {
            reject(e);
        }
    })
}

let getAllHospitalByAdmin = (page, limit, name, provinceId, status) => {
    return new Promise(async (resolve, reject) => {
        try {
            let offset = (page - 1) * limit;

            // Điều kiện lọc
            let where = {};
            if (name) {
                where.name = { [Op.like]: `%${name}%` };
            }
            if (provinceId) {
                where.provinceId = provinceId;
            }
            if (status) {
                where.status = status;
            }

            let { rows, count } = await db.Hospital.findAndCountAll({
                where,
                offset,
                limit,
                order: [["createdAt", "DESC"]],
                include: [
                    {
                        model: db.Province,
                        as: "provinceData", // phải đúng alias
                        attributes: ["id", "name"],
                    },
                    {
                        model: db.Datacode,
                        as: "statusData", // phải đúng alias
                        attributes: ["keyMap", "valueEn", "valueVi"],
                    },
                ],
                raw: true,
                nest: true
            });

            if (rows && rows.length > 0) {
                rows = rows.map(item => {
                    if (item.image) {
                        item.image = Buffer.from(item.image, 'base64').toString('binary');
                    }
                    return item;
                });
            }

            resolve({
                errCode: 0,
                errMessage: "Get all hospital by admin successfully",
                data: rows,
                pagination: {
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil(count / limit),
                },
            });
        } catch (e) {
            console.error("Error in getAllHospitalByAdmin:", e);
            reject(e);
        }
    });
};

let getDetailHospitalById = (inputId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!inputId) {
        resolve({
          errCode: 1,
          errMessage: "Missing parameter",
        });
      } else {
        let hospital = await db.Hospital.findOne({
          where: { id: inputId },
          include: [
            {
              model: db.Province,
              as: "provinceData",
              attributes: ["id", "name"],
            },
            {
              model: db.CommuneUnit,
              as: "communeUnitData",
              attributes: ["id", "name"],
            },
            {
              model: db.Datacode,
              as: "statusData",
              attributes: ["keyMap", "valueEn", "valueVi"],
            },
          ],
          raw: false,
          nest: true,
        });

        if (!hospital) {
          resolve({
            errCode: 2,
            errMessage: "Hospital not found",
            data: {},
          });
        } else {
          // convert ảnh từ base64 → binary string
          let hospitalData = hospital.toJSON();
          if (hospitalData.image) {
            hospitalData.image = Buffer.from(hospitalData.image, "base64").toString("binary");
          }

          // Lấy chuyên khoa của bệnh viện
          let specialties = await db.Hospital_Specialties.findAll({
            where: { hospitalId: inputId },
            include: [
              {
                model: db.Specialty,
                as: "specialty",
                attributes: ["id", "name", "descriptionMarkdown"],
              },
            ],
            raw: true,
            nest: true,
          });

          // Lấy lãnh đạo bệnh viện (roleId = R4)
          let leaders = await db.User.findAll({
            where: { hospitalId: inputId, roleId: "R4" },
            attributes: ["id", "fullName", "email", "phoneNumber", "avatar"],
            raw: true,
          });

          // convert avatar lãnh đạo
          leaders = leaders.map((item) => {
            if (item.avatar) {
              item.avatar = Buffer.from(item.avatar, "base64").toString("binary");
            }
            return item;
          });

          // Lấy danh sách bác sĩ
          let doctors = await db.Doctor_Infor.findAll({
            where: { hospitalId: inputId },
            include: [
              {
                model: db.User,
                as: "doctor",
                attributes: ["id", "fullName", "email", "phoneNumber", "avatar"],
              },
              {
                model: db.Specialty,
                as: "specialty",
                attributes: ["id", "name"],
              },
            ],
            raw: true,
            nest: true,
          });

          // convert avatar bác sĩ
          doctors = doctors.map((item) => {
            if (item.doctor && item.doctor.avatar) {
              item.doctor.avatar = Buffer.from(item.doctor.avatar, "base64").toString("binary");
            }
            return item;
          });

          resolve({
            errCode: 0,
            errMessage: "Get detail hospital successfully",
            data: {
              ...hospitalData,
              specialties,
              leaders,
              doctors,
            },
          });
        }
      }
    } catch (e) {
      reject(e);
    }
  });
};

let updateHospitalById = async (data) => {
  try {
    if (!data.id) {
      return {
        errCode: 1,
        errMessage: "Missing hospital id",
      };
    }

    let hospital = await db.Hospital.findOne({
      where: { id: data.id },
      raw: false,
    });

    if (!hospital) {
      return {
        errCode: 2,
        errMessage: "Hospital not found",
      };
    }

    // update field
    hospital.name = data.name;
    hospital.provinceId = data.provinceId;
    hospital.addressDetail = data.addressDetail;
    hospital.descriptionMarkdown = data.descriptionMarkdown;
    hospital.descriptionHTML = data.descriptionHTML;
    if (data.imageBase64) {
      hospital.image = data.imageBase64;
    }

    await hospital.save();

    return {
      errCode: 0,
      errMessage: "Update hospital success",
    };
  } catch (e) {
    throw e;
  }
};

module.exports = {
    createHospital: createHospital,
    getAllHospital: getAllHospital,
    getAllHospitalByAdmin: getAllHospitalByAdmin,
    getDetailHospitalById: getDetailHospitalById,
    updateHospitalById: updateHospitalById
}