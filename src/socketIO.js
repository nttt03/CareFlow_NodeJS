// src/socketIO.js
import { Server } from "socket.io";

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.URL_REACT || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("joinDoctorRoom", (doctorId) => {
      if (doctorId) socket.join(`doctor_${doctorId}`);
    });

    socket.on("leaveDoctorRoom", (doctorId) => {
      if (doctorId) socket.leave(`doctor_${doctorId}`);
    });

    socket.on("joinAdminRoom", (adminId) => {
      if (adminId) socket.join(`admin_${adminId}`);
    });

    socket.on("leaveAdminRoom", (adminId) => {
      if (adminId) socket.leave(`admin_${adminId}`);
    });

    socket.on("joinCustomerRoom", (customerId) => {
      if (customerId) socket.join(`customer_${customerId}`);
    });

    socket.on("leaveCustomerRoom", (customerId) => {
      if (customerId) socket.leave(`customer_${customerId}`);
    });

    socket.on("joinLeaderRoom", (leaderId) => {
      if (leaderId) socket.join(`leader_${leaderId}`);
    });

    socket.on("leaveLeaderRoom", (leaderId) => {
      if (leaderId) socket.leave(`leader_${leaderId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", socket.id, reason);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initSocket(server) first.");
  }
  return io;
};