const orderService = require('./order.service');
const { successResponse, paginatedResponse } = require('../../utils/response.util');

const createOrder = async (req, res, next) => {
  try {
    const result = await orderService.createOrder(req.body, req.user._id);
    const status = result.already_exists ? 200 : 201;
    return res.status(status).json(successResponse(result.already_exists ? 'Order already synced' : 'Order created', result));
  } catch (err) { next(err); }
};

const getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = '', picker_id = '', search = '' } = req.query;
    const result = await orderService.getOrders({ page: parseInt(page), limit: parseInt(limit), status, picker_id, search });
    return res.status(200).json(paginatedResponse('Orders fetched', result.orders, result.total, result.page, result.limit));
  } catch (err) { next(err); }
};

const getOrderById = async (req, res, next) => {
  try {
    const result = await orderService.getOrderById(req.params.id);
    return res.status(200).json(successResponse('Order fetched', result));
  } catch (err) { next(err); }
};

const updateOrderItem = async (req, res, next) => {
  try {
    const item = await orderService.updateOrderItem(req.params.id, req.params.itemId, req.body, req.user._id);
    return res.status(200).json(successResponse('Item updated', { item }));
  } catch (err) { next(err); }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus(req.params.id, req.body.status, req.user._id);
    return res.status(200).json(successResponse('Order status updated', { order }));
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await orderService.getStats();
    return res.status(200).json(successResponse('Stats fetched', { stats }));
  } catch (err) { next(err); }
};

module.exports = { createOrder, getOrders, getOrderById, updateOrderItem, updateOrderStatus, getStats };
