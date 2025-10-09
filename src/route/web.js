import express from "express";
import homeController from "../controllers/homeController";
import userController from "../controllers/userController";
import doctorController from "../controllers/doctorController";
import patientController from "../controllers/patientController";
import specialtyController from "../controllers/specialtyController";
import hospitalController from "../controllers/hospitalController";
import chatbotController  from "../controllers/chatbotController";
import { checkUserJWT, verifyCaptcha } from "../middleware/JWTAction";
import notificationController from "../controllers/notificationController";
let router = express.Router();

let initWebRoutes = (app) => {
    router.get('/', homeController.getHomePage);
    router.get('/crud', homeController.getCRUD);
    router.post('/post-crud', homeController.postCRUD);
    router.get('/get-crud', homeController.getDataCRUD);
    router.get('/edit-crud', homeController.getEditCRUD);
    router.post('/put-crud', homeController.putCRUD);
    router.get('/delete-crud', homeController.deleteCRUD);

    router.post('/api/login', userController.handleLogin);
    router.post('/api/register', verifyCaptcha, userController.handleRegister);
    router.post('/api/changepassword', checkUserJWT, verifyCaptcha, userController.handleChangePassword);
    router.get('/api/get-all-users', userController.handleGetAllUsers);
    router.post('/api/create-new-user', userController.handleCreateNewUser);
    router.put('/api/edit-user', userController.handleEditUser);
    router.delete('/api/delete-user', userController.handleDeleteUser);
    router.get("/api/allcode", userController.getAllCode);
    router.get("/api/allprovince", userController.getAllProvince);

    router.get("/api/top-doctor-home", doctorController.getTopDoctorHome);
    router.get("/api/get-all-doctor", doctorController.getGetAllDoctor);
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

    router.post("/api/create-new-specialty", specialtyController.createSpecialty);
    router.get("/api/get-all-specialty", specialtyController.getAllSpecialty);
    router.get("/api/get-detail-specialty-by-id", specialtyController.getDetailSpecialtyById);
    router.get("/api/get-detail-specialty", specialtyController.getDetailSpecialty);
    router.put("/api/update-specialty-by-id", specialtyController.updateSpecialtyById);
    router.delete("/api/delete-specialty-by-id", specialtyController.deleteSpecialtyById);

    router.post("/api/create-new-hospital", hospitalController.createHospital);
    router.get("/api/get-all-hospital", hospitalController.getAllHospital);
    router.get("/api/get-all-hospital-by-admin", hospitalController.getAllHospitalByAdmin);
    router.get("/api/get-detail-hospital-by-id", hospitalController.getDetailHospitalById);
    router.put("/api/update-hospital-by-id", hospitalController.updateHospitalById);
    router.delete("/api/delete-hospital-by-id", hospitalController.deleteHospitalById);
    router.post("/hospital-specialties", hospitalController.saveSpecialtiesForHospital);
    router.get("/hospital-specialties/:hospitalId", hospitalController.getSpecialtiesByHospital);
    router.get("/hospital-doctors/:hospitalId", hospitalController.getDoctorsByHospital);
    router.post("/hospital-doctors", hospitalController.saveDoctorsForHospital);
    router.post("/save-price-hospital", hospitalController.savePriceForHospital);

    router.get("/api/get-new-appointment", patientController.getNewAppointment);
    router.get("/api/get-done-appointment", patientController.getDoneAppointment);
    router.post("/api/patient-book-appointment", patientController.postBookApointment);
    router.post("/api/verify-book-appointment", patientController.postVerifyBookApointment);
    router.get("/api/get-info-user-by-id", checkUserJWT, patientController.getInfoUserById);
    router.put('/api/update-info-by-user', checkUserJWT, patientController.updateInfoByUser);
    router.post("/api/toggle-favorite", patientController.toggleFavorite);
    router.get("/api/get-favorites", patientController.getUserFavorites);

    // Tạo thông báo
    router.post("/api/notification", notificationController.createNotification);
    // Lấy theo userId hoặc roleId
    router.get(
      "/api/notifications",
      notificationController.getNotificationsByUser
    );
    // Đánh dấu đã đọc
    router.put("/api/notification/read", notificationController.markAsRead);


    router.post('/api/chat', chatbotController.handleChat);
    
    // router.get('/hello', (rep, res) => {
    //     return res.send("Hế lô world ^_^ !")
    // });

    return app.use("/", router);
}

module.exports = initWebRoutes;