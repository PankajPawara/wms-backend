const mongoose = require('mongoose');
const { version } = require('../../../package.json');
const InventoryVersion = require('../../models/InventoryVersion.model');
const ActivityLog = require('../../models/ActivityLog.model');
const { successResponse } = require('../../utils/response.util');

const SystemConfig = require('../../models/SystemConfig.model');

const healthCheck = async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
  res.status(dbState === 1 ? 200 : 503).json({
    success: dbState === 1,
    message: 'WMS Backend',
    data: { status: dbState === 1 ? 'healthy' : 'unhealthy', db: dbStatus, version, timestamp: new Date().toISOString() },
  });
};

const getAppConfig = async (req, res, next) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({
        latest_apk_version: '1.0.0',
        apk_download_url: 'https://github.com/PankajPawara/wms-mobile/releases/latest',
        force_apk_update: false
      });
    }

    const inventoryVersion = await InventoryVersion.findOne({ is_active: true });
    
    return res.status(200).json(successResponse('App Config', {
      latest_apk_version: config.latest_apk_version,
      apk_download_url: config.apk_download_url,
      force_apk_update: config.force_apk_update,
      latest_inventory_version: inventoryVersion ? inventoryVersion.version : 'v0',
    }));
  } catch (err) { next(err); }
};

const getSystemInfo = async (req, res, next) => {
  try {
    const inventoryVersion = await InventoryVersion.findOne({ is_active: true });
    const recentActivity = await ActivityLog.find()
      .populate('user_id', 'name employee_id')
      .sort({ createdAt: -1 })
      .limit(10);
    return res.status(200).json(successResponse('System info', {
      app_version: version,
      db_status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      inventory_version: inventoryVersion ? inventoryVersion.version : 'v0',
      recent_activity: recentActivity,
    }));
  } catch (err) { next(err); }
};

module.exports = { healthCheck, getAppConfig, getSystemInfo };
