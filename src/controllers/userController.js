import userServise from '../services/userService.js'

let handleLogin = async (req, res) => {
    try {
        let email = req.body.email;
        let password = req.body.password;
        if(!email || !password) {
            return res.status(400).json({
                errCode: 1,
                message: 'Vui lòng nhập đầy đủ thông tin!',
                messageEn: 'Please enter complete information!'
            })
        }
        let userData = await userServise.handleUserLogin(email, password);
        // mỗi khi login sẽ set cookie, JWT được gửi về client qua res.cookie() (httpOnly)
        // if (userData && userData.user && userData.user.access_token) {
        //     res.clearCookie("jwt");
        //     res.cookie("jwt", userData.user.access_token, {
        //     httpOnly: true,
        //     secure: false,          // nếu chạy HTTPS (production) thì để true
        //     sameSite: "lax", 
        //     domain: "localhost",
        //     // maxAge: 60 * 60 * 1000, // 1 giờ
        //     maxAge: 24 * 60 * 60 * 1000, // 1 ngày
        //     });
        // }
        if (userData && userData.user && userData.user.access_token) {
            res.clearCookie("jwt");
            res.cookie("jwt", userData.user.access_token, {
            httpOnly: true,
            secure: true,          // nếu chạy HTTPS (production) thì để true
            sameSite: "none",
            // maxAge: 60 * 60 * 1000, // 1 giờ
            maxAge: 24 * 60 * 60 * 1000, // 1 ngày
            });
        }
        return res.status(200).json({
            errCode: userData.errCode,
            message: userData.errMessage,
            messageEn: userData.messageEn,
            user: userData.user ? userData.user : {}
        })
    } catch (e) {
        return res.status(500).json({
            errCode: '-1',
            errMessage: 'Lỗi từ server!',
            DT: '',
        })
    }
}

const handleRegister = async (req, res) => {
    try {
        if (!req.body.email || !req.body.fullName || !req.body.phoneNumber || !req.body.password || !req.body.gender) {
            return res.status(200).json({
                errMessage: "Vui lòng điền đầy đủ thông tin!",
                errCode: '1',
                DT: ''
            })
        }

        if (req.body.password && req.body.password.length < 3) {
            return res.status(200).json({
                errMessage: "Password phải có ít nhất 3 ký tự!",
                errCode: '1',
                DT: ''
            })
        }

        // create user
        let data = await userServise.registerNewUser(req.body)
        return res.status(200).json({
            errMessage: data.errMessage,
            errCode: data.errCode,
            DT: ''
        })

    } catch (e) {
        return res.status(500).json({
            errMessage: 'Lỗi từ server!',
            errCode: '-1',
            DT: '',
        })
    }
}

let handleChangePassword = async (req, res) => {
    try {
        if (!req.body.oldPassword || !req.body.newPassword) {
            return res.status(200).json({
                errMessage: "Vui lòng điền đầy đủ thông tin!",
                errCode: '1',
                DT: ''
            })
        }

        if (req.body.newPassword && req.body.newPassword.length < 6) {
            return res.status(200).json({
                errMessage: "Mật khẩu mới phải có ít nhất 6 ký tự!",
                errCode: '1',
                DT: ''
            })
        }

        // change password
        let userId = req.user.id; // lấy userId từ JWT
        let data = await userServise.handleChangePassword(userId, req.body)
        return res.status(200).json({
            errMessage: data.errMessage,
            errCode: data.errCode,
            DT: ''
        })

    } catch (e) {
        return res.status(500).json({
            errMessage: 'Lỗi từ server!',
            errCode: '-1',
            DT: '',
        })
    }
}

let handleGetAllUsers = async (req, res) => {
    let id = req.query.id; // ALL, id
    if(!id) {
        return res.status(200).json({
            errCode: 1,
            errMessage: 'Missing required parameter',
            users: []
        })
    }
    let users = await userServise.getAllUsers(id);
    console.log(users)

    return res.status(200).json({
        errCode: 0,
        errMessage: 'ok',
        users
    })
}

let handleCreateNewUser = async (req, res) => {
    let message = await userServise.createNewUser(req.body);
    return res.status(200).json(message);
}

let handleEditUser = async (req, res) => {
    let data = req.body;
    let message = await userServise.updateUserData(data);
    return res.status(200).json(message)
}

let handleDeleteUser = async (req, res) => {
    if(!req.body.id) {
        return res.status(200).json({
            errCode: 1,
            errMessage: "Missing required parameters!"
        })
    }
    let message = await userServise.deleteUser(req.body.id);
    return res.status(200).json(message);
}

let getAllCode = async (req, res) => {
    try {
        let data = await userServise.getAllCodeService(req.query.type);
        return res.status(200).json(data);
    } catch (e) {
        console.log('Get all code error: ', e);
        return res.status(200).json({
            errCode: -1,
            errMessage: "Error from server"
        })
    }
}

let getAllProvince = async (req, res) => {
    try {
        let data = await userServise.getAllProvince();
        return res.status(200).json(data);
    } catch (e) {
        console.log('Get all province error: ', e);
        return res.status(200).json({
            errCode: -1,
            errMessage: "Error from server"
        })
    }
}

let handleForgotPassword = async (req, res) => {
    try {
        let { email } = req.body;
        if (!email) {
            return res.status(200).json({
                errCode: 1,
                errMessage: "Vui lòng nhập email!",
            });
        }

        let data = await userServise.handleForgotPassword(email);

        return res.status(200).json({
            errCode: data.errCode,
            errMessage: data.errMessage,
        });

    } catch (e) {
        return res.status(500).json({
            errMessage: "Server error!",
            errCode: -1,
        });
    }
}

let handleResetPassword = async (req, res) => {
    try {
        let { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(200).json({
                errCode: 1,
                errMessage: "Thiếu token hoặc mật khẩu mới!",
            });
        }

        if (newPassword.length < 6) {
            return res.status(200).json({
                errCode: 1,
                errMessage: "Mật khẩu mới phải từ 6 ký tự trở lên!",
            });
        }

        let data = await userServise.handleResetPassword(token, newPassword);

        return res.status(200).json({
            errCode: data.errCode,
            errMessage: data.errMessage,
        });

    } catch (e) {
        return res.status(500).json({
            errMessage: "Server error!",
            errCode: -1,
        });
    }
}

export default {
    handleLogin: handleLogin,
    handleRegister: handleRegister,
    handleGetAllUsers: handleGetAllUsers,
    handleCreateNewUser: handleCreateNewUser,
    handleEditUser: handleEditUser,
    handleDeleteUser: handleDeleteUser,
    getAllCode: getAllCode,
    getAllProvince: getAllProvince,
    handleChangePassword: handleChangePassword,
    handleForgotPassword: handleForgotPassword,
    handleResetPassword: handleResetPassword,

}