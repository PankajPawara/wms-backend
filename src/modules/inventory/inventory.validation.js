const Joi = require('joi');

const searchSchema = Joi.object({
  q: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Search query is required',
    'any.required': 'Search query is required',
  }),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = { searchSchema };
