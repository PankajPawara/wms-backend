const authService = require('./auth.service');
const { successResponse } = require('../../utils/response.util');

const login = async (req, res, next) => {
  try {
    const { token, user, is_first_login } = await authService.login(req.body);
    return res.status(200).json(
      successResponse('Login successful', { token, user, is_first_login })
    );
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const user = await authService.changePassword(req.user._id, req.body);
    return res.status(200).json(successResponse('Password changed successfully', { user }));
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user._id);
    return res.status(200).json(successResponse('Profile fetched', { user }));
  } catch (err) {
    next(err);
  }
};

module.exports = { login, changePassword, getMe };
