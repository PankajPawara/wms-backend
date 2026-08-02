const AppError = require('../utils/error.util');

const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new AppError('Unauthorized access.', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403, 'FORBIDDEN'));
    }

    next();
  };
};

module.exports = roleMiddleware;
