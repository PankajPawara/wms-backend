const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('./error.util');

const signToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Token expired, please log in again', 401, 'UNAUTHORIZED');
    }
    throw new AppError('Invalid token', 401, 'UNAUTHORIZED');
  }
};

module.exports = { signToken, verifyToken };
