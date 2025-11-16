import db from "../models/index.js";
import { getIo } from "../socketIO.js"

function getRoom(receiverRole, receiverId) {
  if (receiverRole === "R2") return `doctor_${receiverId}`;
  if (receiverRole === "R1") return `admin_${receiverId}`;
  if (receiverRole === "R3") return `customer_${receiverId}`;
  if (receiverRole === "R4") return `leader_${receiverId}`;
  return "";
}

let createNotification = async (data) => {
  try {
    const notif = await db.Notification.create({
      senderId: data.senderId,
      receiverId: data.receiverId,
      receiverRole: data.receiverRole,
      message: data.message,
      url: data.url,
      isRead: false,
      idBooking: data.idBooking
    });

    try {
      const io = getIo();
      const room = getRoom(data.receiverRole, data.receiverId);
      if (room) {
        io.to(room).emit("new-notification", notif);
        console.log("Đã emit socket tới:", room);
      }
    } catch (err) {
      console.log("Không thể emit socket:", err);
    }

    return {
      errCode: 0,
      errMessage: "Notification created",
      data: notif,
    };
  } catch (e) {
    console.log("LỖI KHI TẠO NOTIFICATION:", e);
    return {
      errCode: 1,
      errMessage: "Error when creating notification",
    };
  }
};

let sendReviewReminders = async () => {
  try {
    const pendingBookings = await db.Booking.findAll({
      where: { reviewStatus: 'pending', reviewRemindSent: false, statusId: 'S4' },
      include: [{ model: db.User, as: "infoDataDoctor" }], raw: false
    });

    if (!pendingBookings.length) return;

    const io = getIo();

    for (let booking of pendingBookings) {
      // 1. tạo notification
      await createNotification({
        senderId: booking.doctorId,
        receiverId: booking.patientId,
        receiverRole: "R3",
        message: `Bạn có lịch hẹn với bác sĩ ${booking.infoDataDoctor.fullName} cần đánh giá`,
        url: `/review`,
        idBooking: booking.id,
      });

      // 2. emit socket
      io.to(getRoom("R3", booking.patientId)).emit("review-reminder", {
        id: booking.id,
        doctorId: booking.doctorId,
        doctorName: booking.infoDataDoctor?.fullName,
        patientId: booking.patientId,
        date: booking.date,
        timeType: booking.timeType,
      });
      // 3. đánh dấu đã gửi
      booking.reviewRemindSent = true;
      await booking.save();
    }

    console.log("Đã gửi review reminders cho", pendingBookings.length, "booking(s).");
  } catch (err) {
    console.error("sendReviewReminders error:", err);
  }
};

let getNotificationsByUser = async (userId, roleId) => {
  try {
    let notifications = await db.Notification.findAll({
      where: {
        // Dành cho user cụ thể
        ...(userId && { receiverId: userId }),
        // Dành cho thông báo broadcast theo role
        ...(roleId && { receiverRole: roleId }),
      },
      order: [["createdAt", "DESC"]],
    });

    return { errCode: 0, data: notifications };
  } catch (e) {
    console.log(e);
    return { errCode: 1, errMessage: "Error getting notifications" };
  }
};

let markAsRead = async (id) => {
  try {
    let noti = await db.Notification.findOne({ where: { id } });
    if (!noti) {
      console.log("Notification not found for ID:", id);
      return { errCode: 1, errMessage: "Notification not found" };
    }
    await db.Notification.update(
      { isRead: true },
      { where: { id } }
    );
    console.log("Notification marked as read, ID:", id);
    return { errCode: 0, errMessage: "Updated to read" };
  } catch (e) {
    console.log("Error in markAsRead:", e.message, e.stack);
    return { errCode: 1, errMessage: "Error updating" };
  }
};

export default {
  createNotification,
  getNotificationsByUser,
  markAsRead,
  sendReviewReminders,
};
