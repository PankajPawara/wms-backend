const mongoose = require('mongoose');

const inventoryVersionSchema = new mongoose.Schema(
  {
    version: { type: String, required: true, unique: true },
    total_products: { type: Number, required: true },
    imported_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    file_name: { type: String, default: '' },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryVersion', inventoryVersionSchema);
