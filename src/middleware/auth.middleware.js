const { verifyToken } = require('../utils/jwt.util');
const AppError = require('../utils/error.util');
const User = require('../models/User.model');

const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required. Please log in.', 401, 'UNAUTHORIZED'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Attach user to request
    const user = await User.findById(decoded.id).select('-password_hash');
    if (!user) {
      return next(new AppError('User no longer exists.', 401, 'UNAUTHORIZED'));
    }

    if (user.status === 'inactive') {
      return next(new AppError('Your account has been deactivated. Contact admin.', 403, 'FORBIDDEN'));
    }

    // Block non-change-password routes for first-login users
    const isChangePasswordRoute = req.path === '/change-password' && req.method === 'POST';
    if (user.is_first_login && !isChangePasswordRoute) {
      return next(
        new AppError('You must change your password before continuing.', 403, 'FIRST_LOGIN_REQUIRED')
      );
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authMiddleware;
