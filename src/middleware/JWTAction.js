import jwt from 'jsonwebtoken';
require('dotenv').config();

const nonSecurePaths = ["/login", "/register"];

const createJWT = (payload) => {
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

const verifyToken = (token) => {
    let key = process.env.JWT_SECRET;
    let decoded = null;
    try {
        decoded = jwt.verify(token, key);
    } catch (e) {
        console.log('Lỗi verify token: ', e);
    }
    return decoded;
}

const checkUserJWT = (req, res, next) => {
    if (nonSecurePaths.includes(req.path)) return next();
    let cookies = req.cookies;
    if (cookies && cookies.jwt) {
        let token = cookies.jwt;
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

const checkUserPermission = (req, res, next) => {
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

module.exports = {
    createJWT, verifyToken, checkUserJWT, checkUserPermission
}