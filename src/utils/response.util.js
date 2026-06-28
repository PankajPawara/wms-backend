/**
 * Standard success response
 * @param {string} message
 * @param {any} data
 * @returns {object}
 */
const successResponse = (message, data = null) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return response;
};

/**
 * Standard paginated success response
 * @param {string} message
 * @param {Array} items
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 * @returns {object}
 */
const paginatedResponse = (message, items, total, page, limit) => ({
  success: true,
  message,
  data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
});

/**
 * Standard error response
 * @param {string} message
 * @param {string} errorCode
 * @param {Array} errors
 * @returns {object}
 */
const errorResponse = (message, errorCode = 'INTERNAL_ERROR', errors = []) => {
  const response = { success: false, message, error_code: errorCode };
  if (errors.length > 0) response.errors = errors;
  return response;
};

module.exports = { successResponse, paginatedResponse, errorResponse };
