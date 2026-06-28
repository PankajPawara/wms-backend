const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    event_type: {
      type: String,
      required: true,
      enum: [
        'LOGIN',
        'LOGOUT',
        'PASSWORD_CHANGED',
        'INVENTORY_IMPORTED',
        'ORDER_CREATED',
        'ORDER_PICKING_STARTED',
        'ORDER_PICKING_COMPLETED',
        'ORDER_CHECKED',
        'ORDER_CANCELLED',
        'EMPLOYEE_CREATED',
        'EMPLOYEE_UPDATED',
        'EMPLOYEE_DEACTIVATED',
        'SYNC_SUCCESS',
        'SYNC_FAILURE',
      ],
    },
    description: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activityLogSchema.index({ user_id: 1 });
activityLogSchema.index({ event_type: 1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
