import db from '../models/index';
const { Op } = require("sequelize");

let createSpecialty = (data) => {
    return new Promise(async(resolve, reject) => {
        try {
            if (!data.name || !data.imageBase64 || !data.descriptionHTML || !data.descriptionMarkdown) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter...'
                })
            } else {
                await db.Specialty.create({
                    name: data.name,
                    image: data.imageBase64,
                    descriptionHTML: data.descriptionHTML,
                    descriptionMarkdown: data.descriptionMarkdown,
                    status: "A1"
                })
                resolve({
                    errCode: 0,
                    errMessage: 'Create specialty successfully'
                })
            }
            
        } catch (e) {
            reject(e)
        }
    })
}

let getAllSpecialty = (page, limit, name, status) => {
    return new Promise(async(resolve, reject) => {
        try {
            let offset = (page - 1) * limit;
            let where = {};
            if (name) {
                where.name = { [Op.like]: `%${name}%` };
            }
            if (status) {
                where.status = status;
            }

            let { rows, count } = await db.Specialty.findAndCountAll({
                where,
                offset,
                limit,
                order: [["createdAt", "DESC"]],
                include: [   
                    {
                        model: db.Datacode,
                        as: "statusData",
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
                errMessage: 'Get all specialty successfully',
                data: rows,
                pagination: {
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil(count / limit),
                },
            })
        } catch (e) {
            reject(e);
        }
    })
}

// let getDetailSpecialtyById = (inputId, location) => {
//     return new Promise(async(resolve, reject) => {
//         try {
//             if (!inputId || !location) {
//                 resolve({
//                     errCode: 1,
//                     errMessage: 'Missing parameter'
//                 })
//             } else {
//                 let data = await db.Specialty.findOne({
//                     where: {
//                         id: inputId
//                     },
//                     attributes: ['descriptionHTML', 'descriptionMarkdown'],
//                 })

//                 if (data) {
//                     let doctorSpecialty = [];
//                     if (location === 'ALL') {
//                         doctorSpecialty = await db.Doctor_Infor.findAll({
//                             where: {
//                                 specialtyId: inputId
//                             },
//                             attributes: ['doctorId', 'provinceId'],
//                         })
//                     } else {
//                         // find by location
//                         doctorSpecialty = await db.Doctor_Infor.findAll({
//                             where: {
//                                 specialtyId: inputId,
//                                 provinceId: location
//                             },
//                             attributes: ['doctorId', 'provinceId'],
//                         })
//                     }
                    
//                     data.doctorSpecialty = doctorSpecialty;

//                 } else data = {}
//                 resolve({
//                     errCode: 0,
//                     errMessage: 'Get detail specialty successfully',
//                     data
//                 })
//             }
//         } catch (e) {
//             reject(e);
//         }
//     })
// }

let getDetailSpecialtyById = (inputId, location) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!inputId || !location) {
        resolve({
          errCode: 1,
          errMessage: "Missing parameter",
        });
      } else {
        // lấy mô tả chuyên khoa
        let data = await db.Specialty.findOne({
          where: { id: inputId },
          attributes: ["name", "image", "descriptionHTML", "descriptionMarkdown"],
        });

        if (data) {
          let hospitalSpecialties = [];

          if (location === "ALL") {
            // lấy tất cả bệnh viện có chuyên khoa này
            hospitalSpecialties = await db.Hospital_Specialties.findAll({
              where: { specialtyId: inputId },
              include: [
                {
                  model: db.Hospital,
                  as: "hospital",
                  attributes: [
                    "id",
                    "name",
                    "addressDetail",
                    "provinceId",
                    // "communeUnitId",
                    // "descriptionHTML",
                    // "descriptionMarkdown",
                    "image",
                  ],
                  include: [
                    {
                      model: db.Province,
                      as: "provinceData",
                      attributes: ["name"],
                    },
                  ],
                },
              ],
              attributes: ["price"],
              raw: false,
              nest: true,
            });
          } else {
            // lọc theo location (provinceId)
            hospitalSpecialties = await db.Hospital_Specialties.findAll({
              where: { specialtyId: inputId },
              include: [
                {
                  model: db.Hospital,
                  as: "hospital",
                  where: { provinceId: location },
                  attributes: [
                    "id",
                    "name",
                    "addressDetail",
                    "provinceId",
                    // "communeUnitId",
                    // "descriptionHTML",
                    // "descriptionMarkdown",
                    "image",
                  ],
                  include: [
                    {
                      model: db.Province,
                      as: "provinceData",
                      attributes: ["name"],
                    },
                  ],
                },
              ],
              attributes: ["price"],
              raw: false,
              nest: true,
            });
          }

          data.hospitalSpecialties = hospitalSpecialties;
        } else data = {};

        resolve({
          errCode: 0,
          errMessage: "Get detail specialty successfully",
          data,
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};


let getDetailSpecialty = (inputId) => {
    return new Promise(async(resolve, reject) => {
        try {
            if (!inputId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter'
                })
            } else {
                let data = await db.Specialty.findOne({
                    where: {
                        id: inputId
                    },
                })
                if (data.image) {
                    data.image = Buffer.from(data.image, "base64").toString("binary");
                }

                resolve({
                    errCode: 0,
                    errMessage: 'Get detail specialty successfully',
                    data
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}

let updateSpecialtyById = async (data) => {
  try {
    if (!data.id) {
      return {
        errCode: 1,
        errMessage: "Missing specialty id",
      };
    }

    let specialty = await db.Specialty.findOne({
      where: { id: data.id },
      raw: false,
    });

    if (!specialty) {
      return {
        errCode: 2,
        errMessage: "Specialty not found",
      };
    }

    // update field
    specialty.name = data.name;
    specialty.descriptionMarkdown = data.descriptionMarkdown;
    specialty.descriptionHTML = data.descriptionHTML;
    specialty.status = data.status;
    if (data.imageBase64) {
      specialty.image = data.imageBase64;
    }

    await specialty.save();

    return {
      errCode: 0,
      errMessage: "Update specialty success",
    };
  } catch (e) {
    throw e;
  }
};

let deleteSpecialtyById = async (id) => {
  try {
    let specialty = await db.Specialty.findOne({
      where: { id: id },
    });

    if (!specialty) {
      return {
        errCode: 2,
        errMessage: "Specialty not found",
      };
    }

    await db.Specialty.destroy({
      where: { id: id },
    });

    return {
      errCode: 0,
      errMessage: "Delete specialty successfully",
    };
  } catch (e) {
    throw e;
  }
};

module.exports = {
    createSpecialty: createSpecialty,
    getAllSpecialty: getAllSpecialty,
    getDetailSpecialtyById: getDetailSpecialtyById,
    getDetailSpecialty: getDetailSpecialty,
    updateSpecialtyById: updateSpecialtyById,
    deleteSpecialtyById: deleteSpecialtyById
}