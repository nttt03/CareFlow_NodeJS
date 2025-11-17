import { google } from "googleapis";
import nodemailer from "nodemailer";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// B1: Điều hướng user đến Google để cấp quyền
export const googleAuth = (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    // scope: ["https://www.googleapis.com/auth/gmail.send"],
    scope: ["https://mail.google.com/"],
    prompt: "consent",
  });

  return res.redirect(url);
};

// B2: Google trả về mã → đổi sang Refresh Token
export const googleCallback = async (req, res) => {
  const code = req.query.code;
  const { tokens } = await oauth2Client.getToken(code);

  console.log("🎯 Refresh Token:", tokens.refresh_token);
};
