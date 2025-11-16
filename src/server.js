// server.js - DÙNG require CHO TẤT CẢ
const express = require("express");
const bodyParser = require("body-parser");
const viewEngine = require("./config/viewEngine");
const initWebRoutes = require("./route/web");
const cookieParser = require("cookie-parser");
require("dotenv").config();

//// services/scheduler
const http = require("http");
const { initSocket } = require("./socketIO");

// SỬA DÒNG NÀY:
const { connectDB } = require("./config/connectDB"); // <-- DÙNG require + destructuring

let app = express();

// CORS
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", process.env.URL_REACT);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

// Body parser
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(cookieParser());

viewEngine(app);
initWebRoutes(app);

// GỌI HÀM connectDB
connectDB(); // <-- GỌI TRỰC TIẾP

let port = process.env.PORT || 3030;
const server = http.createServer(app);
initSocket(server);

server.listen(port, () => {
  console.log("Backend Nodejs (with Socket.IO) is running on port: " + port);
});