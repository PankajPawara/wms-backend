const User = require('../../models/User.model');
const ActivityLog = require('../../models/ActivityLog.model');
const { signToken } = require('../../utils/jwt.util');
const AppError = require('../../utils/error.util');

const login = async ({ employee_id, password }) => {
  // Find user with password_hash included
  const user = await User.findOne({ employee_id: employee_id.toUpperCase() }).select('+password_hash');
  if (!user) {
    throw new AppError('Invalid Employee ID or password', 401, 'UNAUTHORIZED');
  }

  if (user.status === 'inactive') {
    throw new AppError('Your account is deactivated. Contact admin.', 403, 'FORBIDDEN');
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new AppError('Invalid Employee ID or password', 401, 'UNAUTHORIZED');
  }

  const token = signToken({ id: user._id, role: user.role, employee_id: user.employee_id });

  // Log activity
  await ActivityLog.create({
    user_id: user._id,
    event_type: 'LOGIN',
    description: `${user.name} logged in`,
  });

  return { token, user, is_first_login: user.is_first_login };
};

const changePassword = async (userId, { current_password, new_password }) => {
  const user = await User.findById(userId).select('+password_hash');
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  const isCorrect = await user.comparePassword(current_password);
  if (!isCorrect) {
    throw new AppError('Current password is incorrect', 400, 'VALIDATION_ERROR');
  }

  if (current_password === new_password) {
    throw new AppError('New password must be different from current password', 400, 'VALIDATION_ERROR');
  }

  user.password_hash = new_password; // pre-save hook will hash it
  user.is_first_login = false;
  await user.save();

  await ActivityLog.create({
    user_id: user._id,
    event_type: 'PASSWORD_CHANGED',
    description: `${user.name} changed their password`,
  });

  return user;
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  return user;
};

module.exports = { login, changePassword, getMe };
