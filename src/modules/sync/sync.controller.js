const syncService = require('./sync.service');
const { successResponse } = require('../../utils/response.util');

const getSyncStatus = async (req, res, next) => {
  try {
    const status = await syncService.getSyncStatus();
    return res.status(200).json(successResponse('Sync status', { status }));
  } catch (err) { next(err); }
};

const syncOrders = async (req, res, next) => {
  try {
    const { orders = [] } = req.body;
    const results = await syncService.syncOrders(orders, req.user._id);
    return res.status(200).json(successResponse('Orders synced', { results }));
  } catch (err) { next(err); }
};

const syncOrderItems = async (req, res, next) => {
  try {
    const { items = [] } = req.body;
    const results = await syncService.syncOrderItems(items, req.user._id);
    return res.status(200).json(successResponse('Order items synced', { results }));
  } catch (err) { next(err); }
};

module.exports = { getSyncStatus, syncOrders, syncOrderItems };
