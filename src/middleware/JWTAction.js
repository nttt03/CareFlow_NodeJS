import jwt from 'jsonwebtoken';
import "dotenv/config.js";
import axios from "axios";

const nonSecurePaths = ["/login", "/register"];

export const verifyCaptcha = async (req, res, next) => {
  try {
    const token = req.body.captchaToken;
    if (!token) {
      return res.status(400).json({
        errMessage: "Thiếu captcha token!",
        errCode: 1,
      });
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

    const response = await axios.post(url);

    if (response.data.success) {
      return next();
    } else {
      return res.status(400).json({
        errMessage: "Captcha không hợp lệ!",
        errCode: 1,
      });
    }
  } catch (e) {
    console.error("Captcha verify error:", e);
    return res.status(500).json({
      errMessage: "Lỗi xác thực Captcha!",
      errCode: -1,
    });
  }
};

export const createJWT = (payload) => {
    let key = process.env.JWT_SECRET;
    let token = null;
    try {
        token = jwt.sign(payload, key, {expiresIn: process.env.JWT_EXPIREIN});
        // console.log("token: ", token);
    } catch (e) {
        console.log('Lỗi sign token: ', e);
    }
    return token;
}

export const verifyToken = (token) => {
    let key = process.env.JWT_SECRET;
    let decoded = null;
    try {
        decoded = jwt.verify(token, key);
    } catch (e) {
        console.log('Lỗi verify token: ', e);
    }
    return decoded;
}

export const createRefreshToken = (payload) => {
    let key = process.env.JWT_REFRESH_SECRET;
    let token = null;
    try {
        token = jwt.sign(payload, key, {
            expiresIn: process.env.JWT_REFRESH_EXPIREIN || "7d",
        });
    } catch (e) {
        console.log("Lỗi sign refresh token: ", e);
    }
    return token;
};

export const verifyRefreshToken = (token) => {
    let key = process.env.JWT_REFRESH_SECRET;
    let decoded = null;
    try {
        decoded = jwt.verify(token, key);
    } catch (e) {
        console.log("Lỗi verify refresh token: ", e);
    }
    return decoded;
};

export const checkUserJWT = (req, res, next) => {
    if (nonSecurePaths.includes(req.path)) return next();
    let cookies = req.cookies;
    if (cookies && cookies.access_token) {
        let token = cookies.access_token;
        let decoded = verifyToken(token);
        if (decoded) {
            req.user = decoded; // gửi kèm thông tin user vào req
            req.token = token;
            next();
        } else {
            return res.status(401).json({
                EC: -1,
                EM: 'Not authenticated the user',
                DT: ''
            })
        }
        // console.log('my jwt: ', cookies.jwt);
    } else {
        return res.status(401).json({
            EC: -1,
            EM: 'Not authenticated the user',
            DT: ''
        })
    }

}

export const checkUserPermission = (req, res, next) => {
    if (nonSecurePaths.includes(req.path) || req.path === '/account') return next();
    if (req.user) {
        let email = req.user.email;
        let roles = req.user.groupWithRoles.Roles;
        let currentUrl = req.path;
        if (!roles || roles.length === 0) {
            return res.status(403).json({
                EC: -1,
                EM: `You don't have permission to access this resource!`,
                DT: ''
            })
        }
        let canAccess = roles.some(item => item.url === currentUrl);
        if (canAccess) {
            next();
        } else {
            return res.status(403).json({
                EC: -1,
                EM: `You don't have permission to access this resource!`,
                DT: ''
            })
        }
    } else {
        return res.status(401).json({
            EC: -1,
            EM: 'Not authenticated the user',
            DT: ''
        })
    }
}

export default {
    verifyCaptcha, createJWT, verifyToken, checkUserJWT, checkUserPermission
}