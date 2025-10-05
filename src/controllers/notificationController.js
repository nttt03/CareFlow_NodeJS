import notificationService from '../services/notificationService'

let createNotification = async (req, res) => {
  let result = await notificationService.createNotification(req.body);
  return res.status(200).json(result);
};

let getNotificationsByUser = async (req, res) => {
  let { userId, roleId } = req.query;
  let result = await notificationService.getNotificationsByUser(userId, roleId);
  return res.status(200).json(result);
};

let markAsRead = async (req, res) => {
  let { id } = req.body;
  let result = await notificationService.markAsRead(id);
  return res.status(200).json(result);
};

module.exports = {
  createNotification,
  getNotificationsByUser,
  markAsRead,
};
