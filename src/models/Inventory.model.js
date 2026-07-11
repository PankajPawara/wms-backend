const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    part_no: { type: String, required: true, trim: true, uppercase: true },
    barcode: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    location: { type: String, required: true, trim: true, uppercase: true },
    price: { type: Number, default: 0.0 },
    stock: { type: Number, default: 0 },
    version: { type: String, required: true },
  },
  { timestamps: true }
);

inventorySchema.index({ barcode: 1 });
inventorySchema.index({ part_no: 1 });
inventorySchema.index({ location: 1 });
inventorySchema.index({ description: 'text', part_no: 'text' });

module.exports = mongoose.model('Inventory', inventorySchema);
