import cron from "node-cron";
import patientService from "./patientService.js";

// Lập lịch chạy mỗi ngày lúc 7:00 sáng
cron.schedule("45 10 * * *", async () => {
  console.log(
    "Đang chạy tác vụ nhắc nhở lịch hẹn lúc",
    new Date().toISOString()
  );
  try {
    const result = await patientService.sendAppointmentReminder();
    console.log("Kết quả tác vụ nhắc nhở:", result);
  } catch (error) {
    console.error("Lỗi trong tác vụ nhắc nhở:", error);
  }
});

console.log("Bộ lập lịch nhắc nhở đã khởi động");
