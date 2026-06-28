const User = require('../../models/User.model');
const ActivityLog = require('../../models/ActivityLog.model');
const AppError = require('../../utils/error.util');

const getAllUsers = async ({ page = 1, limit = 20, search = '', status = '' }) => {
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { employee_id: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } },
    ];
  }
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);
  return { users, total, page, limit };
};

const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  return user;
};

const createUser = async (data, adminId) => {
  const { temporary_password, ...rest } = data;
  const user = await User.create({ ...rest, password_hash: temporary_password, is_first_login: true });
  await ActivityLog.create({
    user_id: adminId,
    event_type: 'EMPLOYEE_CREATED',
    description: `Employee ${user.employee_id} created`,
    metadata: { employee_id: user.employee_id },
  });
  return user;
};

const updateUser = async (id, data, adminId) => {
  const user = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  await ActivityLog.create({
    user_id: adminId,
    event_type: 'EMPLOYEE_UPDATED',
    description: `Employee ${user.employee_id} updated`,
  });
  return user;
};

const updateUserStatus = async (id, status, adminId) => {
  const user = await User.findByIdAndUpdate(id, { status }, { new: true });
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  const eventType = status === 'inactive' ? 'EMPLOYEE_DEACTIVATED' : 'EMPLOYEE_UPDATED';
  await ActivityLog.create({
    user_id: adminId,
    event_type: eventType,
    description: `Employee ${user.employee_id} status set to ${status}`,
  });
  return user;
};

const deleteUser = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  if (user.role === 'admin') throw new AppError('Cannot delete admin account', 403, 'FORBIDDEN');
  await User.findByIdAndDelete(id);
};

const getStats = async () => {
  const [total, active, inactive, adminCount, employeeCount] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: 'active' }),
    User.countDocuments({ status: 'inactive' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'employee' }),
  ]);
  return { total, active, inactive, adminCount, employeeCount };
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, updateUserStatus, deleteUser, getStats };
