const notificationService = require('./notification.service');
const { successResponse } = require('../../utils/response.util');

const getNotifications = async (req, res, next) => {
  try {
    const list = await notificationService.getNotificationsForUser(req.user);
    res.status(200).json(successResponse('Notifications fetched', { items: list }));
  } catch (err) {
    next(err);
  }
};

const requestReset = async (req, res, next) => {
  try {
    const { employee_id } = req.body;
    const request = await notificationService.createResetRequest(employee_id);
    res.status(200).json(successResponse('Password reset request submitted successfully', { request }));
  } catch (err) {
    next(err);
  }
};

const actionReset = async (req, res, next) => {
  try {
    const { action } = req.body;
    const result = await notificationService.handleResetAction(req.params.id, action, req.user._id);
    res.status(200).json(successResponse(`Request ${action}ed successfully`, { notification: result }));
  } catch (err) {
    next(err);
  }
};

const readAllNotifications = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user._id);
    res.status(200).json(successResponse('All notifications marked as read'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotifications,
  requestReset,
  actionReset,
  readAllNotifications,
};
