import { where } from "sequelize";
import db from "../models/index";
import bcrypt from 'bcryptjs'; // import thư viện hashPassword

const salt = bcrypt.genSaltSync(10);
let hashUserPassword = (password) => {
    return new Promise(async(resolve, reject) => {
        try {
            let hashPassword = await bcrypt.hashSync(password, salt);
            resolve(hashPassword);
        } catch(e) {
            reject(e)
        }

    })
}

let handleUserLogin = (email, password) => {
    return new Promise(async (resolve, reject) => {
        try {
            let userData = {};

            let isExist = await checkUserEmail(email);
            if(isExist) {
                // user already exist
                let user = await db.User.findOne({
                    where: { email: email },
                    attributes: ['id', 'email', 'roleId', 'password', 'firstName', 'lastName'],
                    raw: true
                });
                if(user) {
                    // compare password
                    let check = await bcrypt.compareSync(password, user.password);
                    if(check) {
                        userData.errCode = 0;
                        userData.errMessage = "ok";

                        delete user.password;
                        userData.user = user;
                    }else {
                        userData.errCode = 3;
                        userData.errMessage = 'wrong password';
                    }
                }
                else {
                    userData.errCode = 2;
                    userData.errMessage = `User's not found`
                
                }

            }else {
                userData.errCode = 1;
                userData.errMessage = `Your's email isn't exist in your system. Please try other email!`;
            }
            resolve(userData)
        } catch(e) {
            reject(e)
        }
    })
}

let checkUserEmail = (userEmail) => {
    return new Promise(async (resolve, reject) => {
        try {
            let user = await db.User.findOne({
                where: { email: userEmail }
            })
            if(user) {
                resolve(true)
            }else {
                resolve(false)
            }
        } catch(e) {
            reject(e)
        }
    })
}

let getAllUsers = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let users = '';
            if(userId === 'ALL') {
                users = await db.User.findAll({
                    // Không lấy dl của trường password
                    attributes: {
                        exclude: ['password']
                    }
                })
            }
            if(userId && userId !== 'ALL') {
                users = await db.User.findOne({
                    where: { id: userId },
                    attributes: {
                        exclude: ['password']
                    }
                })
            }

            resolve(users);
        } catch (e) {
            reject(e);
        }
    })
}

let createNewUser = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            // check email is exist ?
            let check = await checkUserEmail(data.email);
            if(check === true) {
                resolve({
                    errCode: 1,
                    errMessage: 'Your email is already in used, pls try another email!'
                });
            }
            else {
                let hashPasswordFromBcrypt = await hashUserPassword(data.password);
                await db.User.create({
                    email: data.email,
                    password: hashPasswordFromBcrypt,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    address: data.address,
                    phoneNumber: data.phoneNumber,
                    gender: data.gender,
                    roleId: data.roleId,
                    positionId: data.positionId,
                    image: data.avatar,
            })
            resolve({
                errCode: 0,
                errMessage: 'OK'
            });
            }
           
        } catch (e) {
            reject(e);
        }
    })
}

let deleteUser = (userId) => {
    return new Promise(async (resolve, reject) => {
        let user = await db.User.findOne({
            where: { id: userId },
            //  phải set lại raw: false để lấy user trong database ra như 1 instance, vì trong file config.json đã đặt "raw": true
            //  vì mấy hàm save() với destroy() chỉ làm việc dc với instance thôi
            raw: false
        })
       if(!user) {
            resolve({
                errCode: 2,
                errMessage: `The user isn't exist`
            })
       }

       await user.destroy();
        resolve({
            errCode: 0,
            errMessage: `Delete user success`
        })
    })
}

let updateUserData = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if(!data.id || !data.roleId || !data.positionId || !data.gender) {
                resolve({
                    errCode: 2,
                    errMessage: 'Missing required id parameter'
                });
            }
            let user = await db.User.findOne({
                where: {id: data.id},
                raw: false
                
            })
            if (user) {
                user.lastName = data.lastName;
                user.firstName = data.firstName;
                user.address = data.address;
                user.roleId = data.roleId;
                user.positionId = data.positionId;
                user.gender = data.gender;
                user.phoneNumber = data.phoneNumber;
                if(data.avatar) {
                    user.image = data.avatar
                }

                await user.save();

                resolve({
                    errCode: 0,
                    errMessage: 'Update user success'
                });
            } else {
                resolve({
                    errCode: 1,
                    errMessage: 'User not found!'
                });
            }

        } catch (e) {
            reject(e);
        }
    })
}

let getAllCodeService = (typeInput) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!typeInput) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameter !'
                })

            } else {
                let res = {};
                let allcode = await db.Allcode.findAll({
                    where: {type: typeInput}
                });
                res.errCode = 0;
                res.data = allcode;
                resolve(res);
            }

        } catch (e) {
            reject(e);
        }
    })
}

module.exports = {
    handleUserLogin: handleUserLogin,
    getAllUsers: getAllUsers,
    createNewUser: createNewUser,
    deleteUser: deleteUser,
    updateUserData: updateUserData,
    getAllCodeService: getAllCodeService,

}