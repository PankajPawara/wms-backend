const logger = require('../utils/logger.util');
const { errorResponse } = require('../utils/response.util');

// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'INTERNAL_ERROR';
  let message = err.message || 'Something went wrong';
  let errors = err.validationErrors || [];

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = `Invalid value for field: ${err.path}`;
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    errors = Object.values(err.errors).map((e) => e.message);
    message = 'Validation failed';
  }

  // Log non-operational errors (bugs)
  if (!err.isOperational) {
    logger.error('NON-OPERATIONAL ERROR:', err);
  }

  res.status(statusCode).json(errorResponse(message, errorCode, errors));
};

module.exports = errorMiddleware;
