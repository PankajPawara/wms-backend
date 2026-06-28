const userService = require('./user.service');
const { successResponse, paginatedResponse } = require('../../utils/response.util');

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const result = await userService.getAllUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
    });
    return res.status(200).json(
      paginatedResponse('Users fetched', result.users, result.total, result.page, result.limit)
    );
  } catch (err) { next(err); }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return res.status(200).json(successResponse('User fetched', { user }));
  } catch (err) { next(err); }
};

const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body, req.user._id);
    return res.status(201).json(successResponse('Employee created successfully', { user }));
  } catch (err) { next(err); }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user._id);
    return res.status(200).json(successResponse('Employee updated', { user }));
  } catch (err) { next(err); }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await userService.updateUserStatus(req.params.id, status, req.user._id);
    return res.status(200).json(successResponse(`Employee ${status === 'inactive' ? 'deactivated' : 'activated'}`, { user }));
  } catch (err) { next(err); }
};

const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    return res.status(200).json(successResponse('Employee deleted'));
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await userService.getStats();
    return res.status(200).json(successResponse('Stats fetched', { stats }));
  } catch (err) { next(err); }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, updateUserStatus, deleteUser, getStats };
