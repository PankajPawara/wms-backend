const AppError = require('../utils/error.util');

const adminMiddleware = (req, res, next) => {
  const allowedRoles = ['developer', 'admin', 'acting_admin'];
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return next(new AppError('Access denied. Admin only.', 403, 'FORBIDDEN'));
  }
  next();
};

module.exports = adminMiddleware;
