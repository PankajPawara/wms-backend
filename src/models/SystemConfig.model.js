const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema(
  {
    latest_apk_version: { type: String, default: '1.0.0' },
    apk_download_url: { type: String, default: 'https://github.com/PankajPawara/wms-mobile/releases/latest' },
    force_apk_update: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
