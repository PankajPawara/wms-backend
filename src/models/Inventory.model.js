const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    part_no: { type: String, required: true, unique: true, trim: true, uppercase: true },
    barcode: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true, default: '' },
    location: { type: String, required: true, trim: true, uppercase: true },
    version: { type: String, required: true },
  },
  { timestamps: true }
);

inventorySchema.index({ barcode: 1 }, { unique: true });
inventorySchema.index({ part_no: 1 }, { unique: true });
inventorySchema.index({ location: 1 });
inventorySchema.index({ description: 'text', part_no: 'text' });

module.exports = mongoose.model('Inventory', inventorySchema);
