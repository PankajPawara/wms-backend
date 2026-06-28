const { errorResponse } = require('../utils/response.util');

/**
 * Returns an Express middleware that validates req.body against the given Joi schema.
 * @param {import('joi').Schema} schema
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors = error.details.map((d) => d.message.replace(/['"]/g, ''));
    return res.status(400).json(errorResponse('Validation failed', 'VALIDATION_ERROR', errors));
  }
  next();
};

module.exports = validate;
