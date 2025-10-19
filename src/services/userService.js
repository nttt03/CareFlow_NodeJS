import { where } from "sequelize";
import db from "../models/index";
import { createJWT } from "../middleware/JWTAction";
import bcrypt from "bcryptjs";

const salt = bcrypt.genSaltSync(10);
let hashUserPassword = (password) => {
  return new Promise(async (resolve, reject) => {
    try {
      let hashPassword = await bcrypt.hashSync(password, salt);
      resolve(hashPassword);
    } catch (e) {
      reject(e);
    }
  });
};

let handleUserLogin = (email, password) => {
  return new Promise(async (resolve, reject) => {
    try {
      let userData = {};

      let isExist = await checkUserEmail(email);
      if (isExist) {
        // user already exist
        let user = await db.User.findOne({
          where: { email: email },
          attributes: [
            "id",
            "email",
            "roleId",
            "password",
            "fullName",
            "avatar",
            "addressDetail",
            "phoneNumber",
            "dateOfBirth",
            "CCCD",
            "positionId",
            "status",
            "hospitalId"
          ],
          raw: true,
        });
        if (user) {
          // compare password
          let check = await bcrypt.compareSync(password, user.password);
          if (check) {
            userData.errCode = 0;
            userData.errMessage = "ok";

            delete user.password;
            // userData.user = user;
            let payload = {
              id: user.id,
              email: user.email,
              roleId: user.roleId,
            };
            let token = createJWT(payload);
            if (user && user.avatar) {
              user.avatar = Buffer.from(user.avatar, "base64").toString(
                "binary"
              );
            }
            userData.user = {
              access_token: token,
              id: user.id,
              email: user.email,
              roleId: user.roleId,
              fullName: user.fullName,
              avatar: user.avatar,
              phoneNumber: user.phoneNumber,
              addressDetail: user.addressDetail,
              dateOfBirth: user.dateOfBirth,
              CCCD: user.CCCD,
              positionId: user.positionId,
              status: user.status,
              hospitalId: user.hospitalId
            };
          } else {
            userData.errCode = 3;
            userData.errMessage = "Sai mật khẩu!";
          }
        } else {
          userData.errCode = 2;
          userData.errMessage = `Không tìm thấy người dùng này!`;
        }
      } else {
        userData.errCode = 1;
        userData.errMessage = `Email không tồn tại. Vui lòng thử lại bằng email khác!`;
      }
      resolve(userData);
    } catch (e) {
      reject(e);
    }
  });
};

const checkEmailExist = async (email) => {
  let user = await db.User.findOne({
    where: { email: email },
  });
  if (user) {
    return true;
  }
  return false;
};

const checkPhoneExist = async (phoneNumber) => {
  let user = await db.User.findOne({
    where: { phoneNumber: phoneNumber },
  });
  if (user) {
    return true;
  }
  return false;
};

const registerNewUser = async (rawUserData) => {
  try {
    // check email/phonenumber are exist
    let isEmailExist = await checkEmailExist(rawUserData.email);
    if (isEmailExist === true) {
      return {
        errMessage: "Email đã thực sự tồn tại!",
        errCode: 1,
      };
    }
    let isPhoneExist = await checkPhoneExist(rawUserData.phoneNumber);
    if (isPhoneExist === true) {
      return {
        errMessage: "Số điện thoại đã tồn tại!",
        errCode: 1,
      };
    }

    // hash user password
    let hashPassword = await hashUserPassword(rawUserData.password);

    // create new user
    await db.User.create({
      email: rawUserData.email,
      fullName: rawUserData.fullName,
      phoneNumber: rawUserData.phoneNumber,
      gender: rawUserData.gender,
      password: hashPassword,
      status: "A1",
      roleId: "R3",
    });
    return {
      errMessage: "Đăng ký thành công ✔.",
      errCode: 0,
    };
  } catch (e) {
    console.log("err: ", e);
    return {
      errMessage: "Lỗi hệ thống khi đăng ký tài khoản",
      errCode: -2,
    };
  }
};

let handleChangePassword = async (userId, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      // check user is exist ?
      let user = await db.User.findOne({
        where: { id: userId },
        raw: false,
      });
      if (!user) {
        resolve({
          errCode: 2,
          errMessage: `Người dùng không tồn tại`,
        });
      }

      // compare current password
      let check = await bcrypt.compareSync(data.oldPassword, user.password);
      if (check) {
        // hash new password
        let hashNewPassword = await hashUserPassword(data.newPassword);

        // update password
        user.password = hashNewPassword;

        await user.save();
        resolve({
          errCode: 0,
          errMessage: `Đổi mật khẩu thành công!`,
        });
      } else {
        resolve({
          errCode: 3,
          errMessage: "Mật khẩu hiện tại không đúng!",
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

let checkUserEmail = (userEmail) => {
  return new Promise(async (resolve, reject) => {
    try {
      let user = await db.User.findOne({
        where: { email: userEmail },
      });
      if (user) {
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (e) {
      reject(e);
    }
  });
};

let checkUserPhone = (userPhone) => {
  return new Promise(async (resolve, reject) => {
    try {
      let user = await db.User.findOne({
        where: { phoneNumber: userPhone },
      });
      if (user) {
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (e) {
      reject(e);
    }
  });
};

let getAllUsers = (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let users = "";
      if (userId === "ALL") {
        users = await db.User.findAll({
          // Không lấy dl của trường password
          attributes: {
            exclude: ["password"],
          },
        });
      }
      if (userId && userId !== "ALL") {
        users = await db.User.findOne({
          where: { id: userId },
          attributes: {
            exclude: ["password"],
          },
        });
      }

      resolve(users);
    } catch (e) {
      reject(e);
    }
  });
};

let createNewUser = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      let checkEmail = await checkUserEmail(data.email);
      if (checkEmail === true) {
        resolve({
          errCode: 1,
          errMessage: "Email đã tồn tại, vui lòng dùng email khác!",
        });
        return;
      }

      let checkPhone = await checkUserPhone(data.phoneNumber);
      if (checkPhone === true) {
        resolve({
          errCode: 2,
          errMessage: "Số điện thoại đã tồn tại, vui lòng dùng số khác!",
        });
        return;
      }

      let hashPasswordFromBcrypt = await hashUserPassword(data.password);
      await db.User.create({
        email: data.email,
        password: hashPasswordFromBcrypt,
        fullName: data.fullName,
        address: data.address,
        phoneNumber: data.phoneNumber,
        gender: data.gender,
        roleId: data.roleId,
        positionId: data.positionId,
        image: data.avatar,
        status: data.status,
      });

      resolve({
        errCode: 0,
        errMessage: "OK",
      });
    } catch (e) {
      reject(e);
    }
  });
};

let deleteUser = (userId) => {
  return new Promise(async (resolve, reject) => {
    let user = await db.User.findOne({
      where: { id: userId },
      //  phải set lại raw: false để lấy user trong database ra như 1 instance, vì trong file config.json đã đặt "raw": true
      //  vì mấy hàm save() với destroy() chỉ làm việc dc với instance thôi
      raw: false,
    });
    if (!user) {
      resolve({
        errCode: 2,
        errMessage: `The user isn't exist`,
      });
    }

    await user.destroy();
    resolve({
      errCode: 0,
      errMessage: `Delete user success`,
    });
  });
};

let updateUserData = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.id || !data.roleId) {
        return resolve({
          errCode: 2,
          errMessage: "Missing required id parameter",
        });
      }

      let user = await db.User.findOne({
        where: { id: data.id },
        raw: false,
      });

      if (!user) {
        return resolve({
          errCode: 1,
          errMessage: "User not found!",
        });
      }

      // Check email nếu có thay đổi
      if (data.email && data.email !== user.email) {
        let checkEmail = await db.User.findOne({
          where: { email: data.email },
        });
        if (checkEmail) {
          return resolve({
            errCode: 3,
            errMessage: "Email đã tồn tại, vui lòng chọn email khác!",
          });
        }
        user.email = data.email;
      }

      // Check phone nếu có thay đổi
      if (data.phoneNumber && data.phoneNumber !== user.phoneNumber) {
        let checkPhone = await db.User.findOne({
          where: { phoneNumber: data.phoneNumber },
        });
        if (checkPhone) {
          return resolve({
            errCode: 4,
            errMessage: "Số điện thoại đã tồn tại, vui lòng nhập số khác!",
          });
        }
        user.phoneNumber = data.phoneNumber;
      }

      if (data.password) {
        user.password = await hashUserPassword(data.password);
      }

      // Update các field khác
      user.fullName = data.fullName;
      user.addressDetail = data.address;
      user.roleId = data.roleId;
      user.positionId = data.positionId;
      user.gender = data.gender;
      user.status = data.status;

      if (data.avatar) {
        user.avatar = data.avatar;
      }

      await user.save();

      resolve({
        errCode: 0,
        errMessage: "Update user success",
      });
    } catch (e) {
      reject(e);
    }
  });
};

let getAllCodeService = (typeInput) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!typeInput) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameter !",
        });
      } else {
        let res = {};
        let allcode = await db.Datacode.findAll({
          where: { type: typeInput },
        });
        res.errCode = 0;
        res.data = allcode;
        resolve(res);
      }
    } catch (e) {
      reject(e);
    }
  });
};

let getAllProvince = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let provinces = await db.Province.findAll();
      resolve({
        errCode: 0,
        errMessage: "Get all province success",
        data: provinces,
      });
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = {
  handleUserLogin: handleUserLogin,
  registerNewUser: registerNewUser,
  getAllUsers: getAllUsers,
  createNewUser: createNewUser,
  deleteUser: deleteUser,
  updateUserData: updateUserData,
  getAllCodeService: getAllCodeService,
  getAllProvince: getAllProvince,
  handleChangePassword: handleChangePassword,
};
