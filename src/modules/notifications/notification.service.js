const Notification = require('../../models/Notification.model');
const User = require('../../models/User.model');
const ActivityLog = require('../../models/ActivityLog.model');
const AppError = require('../../utils/error.util');

const getNotificationsForUser = async (user) => {
  // Ensure a gentle app update notification is present in the database
  let appUpdate = await Notification.findOne({ type: 'APP_UPDATE' });
  if (!appUpdate) {
    appUpdate = await Notification.create({
      title: 'App Update Available',
      message: 'A new version of Warehouse Scanner (v3) is now available. Please sync your local database to apply changes.',
      type: 'APP_UPDATE',
      is_read: true,
    });
  } else if (!appUpdate.is_read) {
    appUpdate.is_read = true;
    await appUpdate.save();
  }

  if (user.role === 'admin') {
    // Admins see all admin notifications (user_id = null) + their own + PASSWORD_RESET_REQUESTS
    return await Notification.find({
      $or: [
        { user_id: user._id },
        { user_id: null },
      ]
    }).sort({ createdAt: -1 });
  } else {
    // Normal users see notifications targeted to them specifically (user_id = user._id) or global ones like APP_UPDATE (user_id = null)
    return await Notification.find({
      $or: [
        { user_id: user._id },
        { user_id: null },
      ]
    }).sort({ createdAt: -1 });
  }
};

const createResetRequest = async (employeeId) => {
  const empId = employeeId.trim().toUpperCase();
  const user = await User.findOne({ employee_id: empId });
  if (!user) {
    throw new AppError(`Employee ID ${empId} not found in system`, 404, 'NOT_FOUND');
  }

  // Check if a pending request already exists to avoid spamming
  const existing = await Notification.findOne({
    type: 'PASSWORD_RESET_REQUEST',
    'metadata.employee_id': empId,
    is_actioned: false,
  });
  if (existing) {
    throw new AppError('A password reset request is already pending for this Employee ID', 400, 'ALREADY_PENDING');
  }

  const notification = await Notification.create({
    title: 'Password Reset Request',
    message: `${user.name} (${empId}) requested a password reset.`,
    type: 'PASSWORD_RESET_REQUEST',
    metadata: {
      employee_id: empId,
      user_id: user._id.toString(),
      name: user.name,
    },
  });

  return notification;
};

const handleResetAction = async (notificationId, action, adminId) => {
  const notif = await Notification.findById(notificationId);
  if (!notif) {
    throw new AppError('Notification not found', 404, 'NOT_FOUND');
  }
  if (notif.type !== 'PASSWORD_RESET_REQUEST') {
    throw new AppError('Only password reset notifications can be actioned', 400, 'INVALID_TYPE');
  }
  if (notif.is_actioned) {
    throw new AppError('This request has already been processed', 400, 'ALREADY_PROCESSED');
  }

  const targetUserId = notif.metadata.user_id;
  const employeeId = notif.metadata.employee_id;
  const user = await User.findById(targetUserId);

  if (!user) {
    throw new AppError('Target user not found', 404, 'NOT_FOUND');
  }

  if (action === 'approve') {
    // Set password to default 12345678 and force change on next login
    user.password_hash = '12345678';
    user.is_first_login = true;
    await user.save();

    notif.is_actioned = true;
    notif.is_read = true;
    await notif.save();

    // Notify user
    await Notification.create({
      user_id: user._id,
      title: 'Password Reset Approved',
      message: 'Your password reset request has been APPROVED. Your temporary password is: 12345678',
      type: 'PASSWORD_RESET_APPROVED',
    });

    await ActivityLog.create({
      user_id: adminId,
      event_type: 'PASSWORD_CHANGED',
      description: `Admin approved password reset for ${user.name} (${employeeId})`,
    });
  } else if (action === 'reject') {
    notif.is_actioned = true;
    notif.is_read = true;
    await notif.save();

    // Notify user
    await Notification.create({
      user_id: user._id,
      title: 'Password Reset Rejected',
      message: 'Your password reset request was REJECTED by the administrator.',
      type: 'PASSWORD_RESET_REJECTED',
    });

    await ActivityLog.create({
      user_id: adminId,
      event_type: 'EMPLOYEE_UPDATED',
      description: `Admin rejected password reset for ${user.name} (${employeeId})`,
    });
  } else {
    throw new AppError('Invalid action. Must be approve or reject', 400, 'INVALID_ACTION');
  }

  return notif;
};

const markAllAsRead = async (userId) => {
  await Notification.updateMany({ user_id: userId, is_read: false }, { is_read: true });
};

module.exports = {
  getNotificationsForUser,
  createResetRequest,
  handleResetAction,
  markAllAsRead,
};
