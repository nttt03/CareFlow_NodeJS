// src/server.js
import express from "express";
import bodyParser from "body-parser";
import viewEngine from "./config/viewEngine.js";
import initWebRoutes from "./route/web.js";
import connectDB from "./config/connectDB.js";
import cookieParser from "cookie-parser";
import "./services/scheduler.js";
import { createServer } from "http";
import { initSocket } from "./socketIO.js";
import dotenv from "dotenv";
import "../src/config/passport.js"
dotenv.config();

const app = express();

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.URL_REACT || "https://care-flow-nu.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", true);
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

viewEngine(app);
initWebRoutes(app);

// ĐỢI DB KẾT NỐI XONG MỚI CHẠY SERVER
await connectDB();

const port = process.env.PORT || 3030;
const server = createServer(app);
initSocket(server);

server.listen(port, () => {
  console.log(`Backend Nodejs (with Socket.IO) is running on port: ${port}`);
});

console.log("DEBUG CALLBACK URL:", process.env.GOOGLE_LOGIN_CALLBACK_URL);