const AppError = require('../utils/error.util');

const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Access denied. Admin only.', 403, 'FORBIDDEN'));
  }
  next();
};

module.exports = adminMiddleware;
