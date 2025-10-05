// socketIO.js
let io = null;

function initSocket(server) {
  const { Server } = require("socket.io");

  io = new Server(server, {
    cors: {
      origin: process.env.URL_REACT || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Join room cho bác sĩ
    socket.on("joinDoctorRoom", (doctorId) => {
      if (!doctorId) return;
      const room = `doctor_${doctorId}`;
      socket.join(room);
      console.log(`${socket.id} joined room ${room}`);
    });

    socket.on("leaveDoctorRoom", (doctorId) => {
      if (!doctorId) return;
      socket.leave(`doctor_${doctorId}`);
      console.log(`${socket.id} left room doctor_${doctorId}`);
    });

    // Join room cho admin
    socket.on("joinAdminRoom", (adminId) => {
      if (!adminId) return;
      const room = `admin_${adminId}`;
      socket.join(room);
      console.log(`${socket.id} joined room ${room}`);
    });

    socket.on("leaveAdminRoom", (adminId) => {
      if (!adminId) return;
      socket.leave(`admin_${adminId}`);
      console.log(`${socket.id} left room admin_${adminId}`);
    });

    // Join room cho khách hàng
    socket.on("joinCustomerRoom", (customerId) => {
      if (!customerId) return;
      const room = `customer_${customerId}`;
      socket.join(room);
      console.log(`${socket.id} joined room ${room}`);
    });

    socket.on("leaveCustomerRoom", (customerId) => {
      if (!customerId) return;
      socket.leave(`customer_${customerId}`);
      console.log(`${socket.id} left room customer_${customerId}`);
    });

    // Join room cho leader
    socket.on("joinLeaderRoom", (leaderId) => {
      if (!leaderId) return;
      const room = `leader_${leaderId}`;
      socket.join(room);
      console.log(`${socket.id} joined room ${room}`);
    });

    socket.on("leaveLeaderRoom", (leaderId) => {
      if (!leaderId) return;
      socket.leave(`leader_${leaderId}`);
      console.log(`${socket.id} left room leader_${leaderId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", socket.id, "reason:", reason);
    });
  });

  return io;
}

function getIo() {
  if (!io) {
    throw new Error(
      "Socket.IO not initialized. Call initSocket(server) first."
    );
  }
  return io;
}

module.exports = { initSocket, getIo };
