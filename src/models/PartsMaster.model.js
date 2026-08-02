const mongoose = require('mongoose');

const partsMasterSchema = new mongoose.Schema(
  {
    partNo: { type: String, required: true, unique: true, trim: true, uppercase: true },
    barcode: { type: String, trim: true },
    description: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, uppercase: true },
    mrp: { type: Number, default: 0.0 },
    packQty: { type: Number, default: 1 },
    stockQty: { type: Number, default: 0 },
    mfgMonth: { type: String, trim: true },
    mfgYear: { type: String, trim: true },
    source: { type: String, trim: true },
    lastSeenAt: { type: Date }
  },
  { timestamps: true }
);

partsMasterSchema.index({ barcode: 1 });
partsMasterSchema.index({ location: 1 });
partsMasterSchema.index({ description: 'text', partNo: 'text' });

module.exports = mongoose.model('PartsMaster', partsMasterSchema);
