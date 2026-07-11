const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Target user (null means all admins/users depending on type)
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_APPROVED', 'PASSWORD_RESET_REJECTED', 'APP_UPDATE', 'GENERAL'],
      required: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    is_read: { type: Boolean, default: false },
    is_actioned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user_id: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
