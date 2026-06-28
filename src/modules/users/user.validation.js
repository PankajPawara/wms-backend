const Joi = require('joi');

const createUserSchema = Joi.object({
  employee_id: Joi.string().trim().uppercase().required(),
  name: Joi.string().trim().min(2).max(100).required(),
  mobile: Joi.string().trim().pattern(/^[0-9]{10}$/).required().messages({
    'string.pattern.base': 'Mobile must be a 10-digit number',
  }),
  email: Joi.string().email().lowercase().required(),
  address: Joi.string().trim().allow('').optional(),
  role: Joi.string().valid('admin', 'employee').default('employee'),
  temporary_password: Joi.string().min(8).required().messages({
    'string.min': 'Temporary password must be at least 8 characters',
  }),
});

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  mobile: Joi.string().trim().pattern(/^[0-9]{10}$/).messages({
    'string.pattern.base': 'Mobile must be a 10-digit number',
  }),
  email: Joi.string().email().lowercase(),
  address: Joi.string().trim().allow(''),
}).min(1).messages({
  'object.min': 'Provide at least one field to update',
});

module.exports = { createUserSchema, updateUserSchema };
