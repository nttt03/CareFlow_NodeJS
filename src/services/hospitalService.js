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
    return new Promise(async(resolve, reject) => {
        try {
            if (!inputId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter'
                })
            } else {
                let data = await db.Hospital.findOne({
                    where: {
                        id: inputId
                    },
                    attributes: ['name', 'address', 'descriptionHTML', 'descriptionMarkdown'],
                })

                if (data) {
                    let doctorHospital = [];
                    doctorHospital = await db.Doctor_Infor.findAll({
                        where: {
                            clinicId: inputId
                        },
                        attributes: ['doctorId', 'provinceId'],
                    })
                    
                    data.doctorHospital = doctorHospital;

                } else data = {}
                resolve({
                    errCode: 0,
                    errMessage: 'Get detail clinic successfully',
                    data
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}

module.exports = {
    createHospital: createHospital,
    getAllHospital: getAllHospital,
    getAllHospitalByAdmin: getAllHospitalByAdmin,
    getDetailHospitalById: getDetailHospitalById
}