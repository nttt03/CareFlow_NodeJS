import cron from "node-cron";
import patientService from "./patientService.js";

// Lập lịch chạy mỗi ngày lúc 8:00 sáng (theo UTC render 0 1 -> 8h sáng)
cron.schedule("55 5 * * *", async () => {
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
