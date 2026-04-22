import express from "express";
import multer from "multer";
import homeController from "../controllers/homeController.js";
import userController from "../controllers/userController.js";
import doctorController from "../controllers/doctorController.js";
import patientController from "../controllers/patientController.js";
import specialtyController from "../controllers/specialtyController.js";
import hospitalController from "../controllers/hospitalController.js";
import chatbotController  from "../controllers/chatbotController.js";
import { checkUserJWT, verifyCaptcha } from "../middleware/JWTAction.js";
import notificationController from "../controllers/notificationController.js";
import StatisticController from "../controllers/StatisticController.js";
import { googleAuth, googleCallback } from "../controllers/authController.js";
import passport from "passport"
let router = express.Router();
// Cấu hình multer (lưu file trong bộ nhớ RAM)
const storage = multer.memoryStorage();
const upload = multer({ storage });

let initWebRoutes = (app) => {

  router.get("/api/auth/google", googleAuth);
  router.get("/api/auth/google/callback", googleCallback);

  router.get("/google", userController.googleLogin);

    router.get(
      "/google/callback",
      passport.authenticate("google", { session: false, failureRedirect: "/login" }),
      userController.googleCallbackLogin
    );

    router.get("/api/auth/me", checkUserJWT, userController.getCurrentUser);

    router.get('/', homeController.getHomePage);
    router.get('/crud', homeController.getCRUD);
    router.post('/post-crud', homeController.postCRUD);
    router.get('/get-crud', homeController.getDataCRUD);
    router.get('/edit-crud', homeController.getEditCRUD);
    router.post('/put-crud', homeController.putCRUD);
    router.get('/delete-crud', homeController.deleteCRUD);

    router.post('/api/login', userController.handleLogin);
    router.post('/api/logout', userController.handleLogout);
    router.post('/api/refresh-token', userController.handleRefreshToken);
    router.post('/api/register', verifyCaptcha, userController.handleRegister);
    router.post('/api/changepassword', checkUserJWT, verifyCaptcha, userController.handleChangePassword);
    router.post('/api/forgot-password', userController.handleForgotPassword);
    router.post('/api/reset-password', userController.handleResetPassword);
    router.get('/api/get-all-users', userController.handleGetAllUsers);
    router.post('/api/create-new-user', userController.handleCreateNewUser);
    router.put('/api/edit-user', userController.handleEditUser);
    router.delete('/api/delete-user', userController.handleDeleteUser);
    router.get("/api/allcode", userController.getAllCode);
    router.get("/api/allprovince", userController.getAllProvince);

    router.put('/api/update-info-patient', doctorController.handleUpdateInfoPatient);
    router.get("/api/top-doctor-home", doctorController.getTopDoctorHome);
    router.get("/api/get-all-doctor", doctorController.getGetAllDoctor);
    router.get("/api/get-all-leader-hospital", doctorController.getAllLeaderHospital);
    router.get("/api/get-all-doctor-config", doctorController.getAllDoctorConfig);
    router.post("/api/save-infor-doctor", doctorController.postInforDoctor);
    router.get("/api/get-detail-doctor-by-id", doctorController.getDetailDoctorById);
    router.post("/api/bulk-create-schedule", doctorController.bulkCreateSchedule);
    router.get("/api/get-schedule-doctor-by-date", doctorController.getScheduleByDate);
    router.get("/api/get-extra-infor-doctor-by-id", doctorController.getEtraInforDoctorById);
    router.get("/api/get-profile-doctor-by-id", doctorController.getProfileDoctorById);
    router.get("/api/get-list-patient-for-doctor", doctorController.getListPatientForDoctor);
    router.post("/api/send-remedy", doctorController.sendRemedy);
    router.put("/api/update-booking-status", doctorController.updateBookingStatus);
    // router.post("/api/create-medical-record", doctorController.createMedicalRecord);
    router.post("/api/create-medical-record", upload.single("file"), doctorController.createMedicalRecord);
    router.delete('/api/delete-medical-record', doctorController.handleDeleteMedicalRecord);
    router.get("/api/get-list-booking-approval", doctorController.getListBookingApproval);
    router.get("/api/get-list-booking-approval-for-leader", doctorController.getListBookingApprovalForLeader);
    router.get("/api/get-list-medical-record", doctorController.getListMedicalRecord);
    router.get("/api/get-bookings-calendar", doctorController.getBookingsForCalendar);

    router.post("/api/create-new-specialty", specialtyController.createSpecialty);
    router.get("/api/get-all-specialty", specialtyController.getAllSpecialty);
    router.get("/api/get-detail-specialty-by-id", specialtyController.getDetailSpecialtyById);
    router.get("/api/get-detail-specialty", specialtyController.getDetailSpecialty);
    router.put("/api/update-specialty-by-id", specialtyController.updateSpecialtyById);
    router.delete("/api/delete-specialty-by-id", specialtyController.deleteSpecialtyById);

    router.post("/api/create-new-hospital", hospitalController.createHospital);
    router.get("/api/get-all-hospital", hospitalController.getAllHospital);
    router.get("/api/get-all-hospital-by-admin", hospitalController.getAllHospitalByAdmin);
    router.get("/api/get-all-hospital-by-patient", hospitalController.getAllHospitalByPatient);
    router.get("/api/get-detail-hospital-by-id", hospitalController.getDetailHospitalById);
    router.put("/api/update-hospital-by-id", hospitalController.updateHospitalById);
    router.delete("/api/delete-hospital-by-id", hospitalController.deleteHospitalById);
    router.post("/hospital-specialties", hospitalController.saveSpecialtiesForHospital);
    router.get("/hospital-specialties/:hospitalId", hospitalController.getSpecialtiesByHospital);
    router.get("/hospital-doctors/:hospitalId", hospitalController.getDoctorsByHospital);
    router.post("/hospital-doctors", hospitalController.saveDoctorsForHospital);
    router.post("/hospital-leader", hospitalController.saveLeaderForHospital);
    router.post("/save-price-hospital", hospitalController.savePriceForHospital);

    router.get("/api/get-new-appointment", patientController.getNewAppointment);
    router.get("/api/get-appointment-for-noti", patientController.getAppointmentForNoti);
    router.get("/api/get-done-appointment", patientController.getDoneAppointment);
    router.get("/api/get-appointment-need-review", patientController.getAppointmentNeedReview);
    router.post("/api/patient-book-appointment", checkUserJWT, patientController.postBookApointment);
    router.post("/api/verify-book-appointment", patientController.postVerifyBookApointment);
    router.get("/api/get-info-user-by-id", checkUserJWT, patientController.getInfoUserById);
    router.put('/api/update-info-by-user', checkUserJWT, patientController.updateInfoByUser);
    router.post("/api/toggle-favorite", patientController.toggleFavorite);
    router.get("/api/get-favorites", patientController.getUserFavorites);
    router.get("/api/search", patientController.searchAll);
    router.post("/api/review-doctor", checkUserJWT, patientController.handleCreateReview);
    router.get("/api/reviews", patientController.getReviews);
    router.put("/api/reject-booking-by-patient", patientController.rejectBookingByPatient);
    router.put("/api/soft-delete-conversation/:id", checkUserJWT, patientController.deleteConversation);

    router.get("/api/doctor/:doctorId/statistics", StatisticController.getDoctorStatistics);
    router.get("/api/hospital/:hospitalId/statistics", StatisticController.getHospitalStatistics);
    router.get("/api/admin/statistics", StatisticController.getAdminStatistics);

    router.post("/api/chat-with-db", chatbotController.chatWithDatabase);
    router.get("/api/conversations", chatbotController.getAllConversations);
    router.get("/api/conversations/:id", chatbotController.getConversationDetail);

    // Tạo thông báo
    router.post("/api/notification", notificationController.createNotification);
    // Lấy theo userId hoặc roleId
    router.get(
      "/api/notifications",
      notificationController.getNotificationsByUser
    );
    // Đánh dấu đã đọc
    router.put("/api/notification/read", notificationController.markAsRead);
    
    // router.get('/hello', (rep, res) => {
    //     return res.send("Hế lô world ^_^ !")
    // });

    return app.use("/", router);
}

export default initWebRoutes;