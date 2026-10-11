const notificationService = require('./notification.service');
const { successResponse } = require('../../utils/response.util');
const fcmService = require('./fcm.service');

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

const deleteNotification = async (req, res, next) => {
  try {
    await notificationService.deleteNotification(req.params.id, req.user._id);
    res.status(200).json(successResponse('Notification deleted'));
  } catch (err) {
    next(err);
  }
};

const testPush = async (req, res, next) => {
  try {
    const { token, title, body } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token required' });
    const payload = {
      notification: { title: title || 'Test Title', body: body || 'Test Body' },
      android: {
        priority: 'high',
        notification: {
          channelId: 'inventory_updates_channel_v2',
          sound: 'default'
        }
      },
      data: {
        title: title || 'Test Title',
        body: body || 'Test Body'
      }
    };
    const result = await fcmService.sendDeviceNotification(token, payload);
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || 'Failed to send FCM push notification'
      });
    }
    res.status(200).json(successResponse('Test push triggered successfully', result));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotifications,
  requestReset,
  actionReset,
  readAllNotifications,
  deleteNotification,
  testPush,
};
