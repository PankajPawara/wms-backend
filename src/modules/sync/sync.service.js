const Order = require('../../models/Order.model');
const OrderItem = require('../../models/OrderItem.model');
const InventoryVersion = require('../../models/InventoryVersion.model');
const ActivityLog = require('../../models/ActivityLog.model');
const orderService = require('../orders/order.service');

const getSyncStatus = async () => {
  const version = await InventoryVersion.findOne({ is_active: true });
  return {
    server_time: new Date().toISOString(),
    inventory_version: version ? version.version : 'v0',
    status: 'online',
  };
};

/** Sync a batch of orders from mobile */
const syncOrders = async (orders, userId) => {
  const results = [];
  for (const orderData of orders) {
    try {
      const result = await orderService.createOrder(orderData, userId);
      results.push({ device_id: orderData.device_id, success: true, mongo_id: result.order._id, already_exists: result.already_exists });
    } catch (err) {
      results.push({ device_id: orderData.device_id, success: false, error: err.message });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  if (successCount > 0) {
    await ActivityLog.create({
      user_id: userId,
      event_type: 'SYNC_SUCCESS',
      description: `Mobile sync: ${successCount}/${orders.length} orders synced`,
    });
  }
  return results;
};

/** Sync order item updates from mobile */
const syncOrderItems = async (items, userId) => {
  const results = [];
  for (const item of items) {
    try {
      const { mongo_order_id, device_item_id, ...updateData } = item;
      const updatedItem = await OrderItem.findOneAndUpdate(
        { order_id: mongo_order_id, device_item_id },
        updateData,
        { new: true }
      );
      results.push({ device_item_id, success: !!updatedItem });
    } catch (err) {
      results.push({ device_item_id: item.device_item_id, success: false, error: err.message });
    }
  }
  return results;
};

module.exports = { getSyncStatus, syncOrders, syncOrderItems };
