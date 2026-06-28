const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    memo_number: { type: String, required: true, trim: true },
    customer_name: { type: String, trim: true, default: '' },
    customer_location: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['draft', 'picking', 'pending_checking', 'checked', 'cancelled'],
      default: 'draft',
    },
    picker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    checker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    picked_at: { type: Date, default: null },
    checked_at: { type: Date, default: null },
    final_amount: { type: Number, default: 0 },
    // Mobile device generated ID for sync matching
    device_id: { type: String, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ memo_number: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ picker_id: 1 });
orderSchema.index({ checker_id: 1 });
orderSchema.index({ device_id: 1 });

module.exports = mongoose.model('Order', orderSchema);
