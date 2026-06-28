const Joi = require('joi');

const createOrderSchema = Joi.object({
  memo_number: Joi.string().trim().required(),
  customer_name: Joi.string().trim().allow('').optional(),
  customer_location: Joi.string().trim().allow('').optional(),
  device_id: Joi.string().allow('').optional(),
  items: Joi.array().items(
    Joi.object({
      part_no: Joi.string().trim().required(),
      description: Joi.string().allow('').optional(),
      location: Joi.string().trim().allow('').optional(),
      required_qty: Joi.number().integer().min(1).required(),
      device_item_id: Joi.string().allow('').optional(),
    })
  ).min(1).required(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('picking', 'pending_checking', 'checked', 'cancelled').required(),
});

module.exports = { createOrderSchema, updateStatusSchema };
