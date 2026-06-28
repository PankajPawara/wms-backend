const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    part_no: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, uppercase: true, default: '' },
    required_qty: { type: Number, required: true, min: 1 },
    picked_qty: { type: Number, default: 0, min: 0 },
    checked_qty: { type: Number, default: 0, min: 0 },
    unit_price: { type: Number, default: 0, min: 0 },
    final_price: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'picked', 'checked', 'missing'],
      default: 'pending',
    },
    device_item_id: { type: String, default: null },
  },
  { timestamps: true }
);

orderItemSchema.index({ order_id: 1 });
orderItemSchema.index({ part_no: 1 });

module.exports = mongoose.model('OrderItem', orderItemSchema);
