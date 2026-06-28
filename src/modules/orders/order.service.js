const Order = require('../../models/Order.model');
const OrderItem = require('../../models/OrderItem.model');
const Inventory = require('../../models/Inventory.model');
const ActivityLog = require('../../models/ActivityLog.model');
const AppError = require('../../utils/error.util');

const createOrder = async (data, userId) => {
  const { items, ...orderData } = data;

  // Check if device_id already synced (idempotent)
  if (orderData.device_id) {
    const existing = await Order.findOne({ device_id: orderData.device_id });
    if (existing) return { order: existing, already_exists: true };
  }

  // Enrich items with inventory data
  const enrichedItems = await Promise.all(
    items.map(async (item) => {
      const inv = await Inventory.findOne({ part_no: item.part_no.toUpperCase() });
      return {
        ...item,
        part_no: item.part_no.toUpperCase(),
        description: item.description || (inv ? inv.description : ''),
        location: item.location || (inv ? inv.location : ''),
      };
    })
  );

  const order = await Order.create({ ...orderData, picker_id: userId, status: 'draft' });
  const orderItems = await OrderItem.insertMany(
    enrichedItems.map((i) => ({ ...i, order_id: order._id }))
  );

  await ActivityLog.create({
    user_id: userId,
    event_type: 'ORDER_CREATED',
    description: `Order ${order.memo_number} created`,
    metadata: { order_id: order._id, memo_number: order.memo_number },
  });

  return { order, items: orderItems, already_exists: false };
};

const getOrders = async ({ page = 1, limit = 20, status = '', picker_id = '', search = '' }) => {
  const query = {};
  if (status) query.status = status;
  if (picker_id) query.picker_id = picker_id;
  if (search) query.memo_number = { $regex: search, $options: 'i' };
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('picker_id', 'name employee_id')
      .populate('checker_id', 'name employee_id')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);
  return { orders, total, page, limit };
};

const getOrderById = async (id) => {
  const order = await Order.findById(id)
    .populate('picker_id', 'name employee_id')
    .populate('checker_id', 'name employee_id');
  if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
  const items = await OrderItem.find({ order_id: id });
  return { order, items };
};

const updateOrderItem = async (orderId, itemId, data, userId) => {
  const item = await OrderItem.findOneAndUpdate(
    { _id: itemId, order_id: orderId },
    data,
    { new: true }
  );
  if (!item) throw new AppError('Order item not found', 404, 'NOT_FOUND');
  return item;
};

const updateOrderStatus = async (orderId, status, userId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

  const allowed = {
    draft: ['picking', 'cancelled'],
    picking: ['pending_checking', 'cancelled'],
    pending_checking: ['checked', 'cancelled'],
    checked: [],
    cancelled: [],
  };

  if (!allowed[order.status].includes(status)) {
    throw new AppError(
      `Cannot change status from ${order.status} to ${status}`,
      422,
      'INVALID_ORDER_STATUS'
    );
  }

  const update = { status };
  if (status === 'picking') { update.picker_id = userId; }
  if (status === 'pending_checking') { update.picked_at = new Date(); }
  if (status === 'checked') { update.checker_id = userId; update.checked_at = new Date(); }

  const updated = await Order.findByIdAndUpdate(orderId, update, { new: true });

  const eventMap = {
    picking: 'ORDER_PICKING_STARTED',
    pending_checking: 'ORDER_PICKING_COMPLETED',
    checked: 'ORDER_CHECKED',
    cancelled: 'ORDER_CANCELLED',
  };
  await ActivityLog.create({
    user_id: userId,
    event_type: eventMap[status],
    description: `Order ${order.memo_number} status → ${status}`,
    metadata: { order_id: order._id },
  });

  return updated;
};

const getStats = async () => {
  const [draft, picking, pending_checking, checked, cancelled] = await Promise.all([
    Order.countDocuments({ status: 'draft' }),
    Order.countDocuments({ status: 'picking' }),
    Order.countDocuments({ status: 'pending_checking' }),
    Order.countDocuments({ status: 'checked' }),
    Order.countDocuments({ status: 'cancelled' }),
  ]);
  return { draft, picking, pending_checking, checked, cancelled };
};

module.exports = { createOrder, getOrders, getOrderById, updateOrderItem, updateOrderStatus, getStats };
