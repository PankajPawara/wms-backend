const path = require('path');
const fs = require('fs');
const Inventory = require('../../models/Inventory.model');
const InventoryVersion = require('../../models/InventoryVersion.model');
const ActivityLog = require('../../models/ActivityLog.model');
const { parseInventoryExcel } = require('../../utils/excel.util');
const AppError = require('../../utils/error.util');
const fcmService = require('../notifications/fcm.service');
const Notification = require('../../models/Notification.model');
/** Generate next version string: v1, v2, v3... */
const generateNextVersion = async () => {
  const latest = await InventoryVersion.findOne().sort({ createdAt: -1 });
  if (!latest) return 'v1';
  const num = parseInt(latest.version.replace('v', ''), 10);
  return `v${num + 1}`;
};

const importInventory = async (filePath, fileName, adminId) => {
  // Parse and validate excel
  const products = parseInventoryExcel(filePath);

  // Generate new version
  const newVersion = await generateNextVersion();

  // Mark previous versions as inactive
  await InventoryVersion.updateMany({}, { is_active: false });

  // Batch upsert with version tag
  const withVersion = products.map((p) => ({ ...p, version: newVersion }));
  
  const bulkOps = withVersion.map((product) => {
    const updatePayload = {
      part_no: product.part_no,
      barcode: product.barcode,
      location: product.location,
      version: product.version,
    };
    if (product.description) updatePayload.description = product.description;
    if (product.price) updatePayload.price = product.price;
    if (product.stock) updatePayload.stock = product.stock;

    return {
      updateOne: {
        filter: { part_no: product.part_no },
        update: { $set: updatePayload },
        upsert: true,
      }
    };
  });

  if (bulkOps.length > 0) {
    await Inventory.bulkWrite(bulkOps, { ordered: false });
  }

  // Create version record
  const version = await InventoryVersion.create({
    version: newVersion,
    total_products: products.length,
    imported_by: adminId,
    file_name: fileName,
    is_active: true,
  });

  // Add notification
  await Notification.create({
    user_id: null, // Global
    type: 'APP_UPDATE',
    title: 'New Inventory Version',
    message: `Inventory updated to version ${newVersion}. Please pull to sync.`,
    is_global: true,
  });

  // Send FCM push notification to devices
  await fcmService.sendTopicNotification('inventory_updates', {
    notification: {
      title: 'Location Data Updated',
      body: `Inventory locations updated to version ${newVersion}. Sync now for latest data.`,
    },
    data: {
      type: 'INVENTORY_UPDATE',
      version: newVersion,
    }
  });

  // Cleanup uploaded file
  try { fs.unlinkSync(filePath); } catch (_) {}

  await ActivityLog.create({
    user_id: adminId,
    event_type: 'INVENTORY_IMPORTED',
    description: `Inventory imported: ${products.length} products, version ${newVersion}`,
    metadata: { version: newVersion, total_products: products.length, file_name: fileName },
  });

  return version;
};

const getCurrentVersion = async () => {
  const version = await InventoryVersion.findOne({ is_active: true });
  return version;
};

/** Download inventory for mobile sync, optionally returning only delta */
const downloadInventory = async (sinceDate) => {
  const version = await InventoryVersion.findOne({ is_active: true });
  const query = {};
  if (sinceDate) {
    const date = new Date(sinceDate);
    if (!isNaN(date.getTime())) {
      query.updatedAt = { $gt: date };
    }
  }
  const items = await Inventory.find(query).lean();
  return { version: version ? version.version : 'v0', items };
};

const findByBarcode = async (barcode) => {
  const product = await Inventory.findOne({ barcode: barcode.trim() });
  if (!product) throw new AppError('Barcode not found in inventory', 404, 'BARCODE_NOT_FOUND');
  return product;
};

const findByPartNo = async (partNo) => {
  const product = await Inventory.findOne({ part_no: partNo.trim().toUpperCase() });
  if (!product) throw new AppError('Part number not found in inventory', 404, 'PART_NOT_FOUND');
  return product;
};

const searchInventory = async (query, limit = 20) => {
  const q = query.trim().toUpperCase();
  const products = await Inventory.find({
    $or: [
      { part_no: { $regex: q, $options: 'i' } },
      { barcode: { $regex: q, $options: 'i' } },
      { description: { $regex: query.trim(), $options: 'i' } },
      { location: { $regex: q, $options: 'i' } },
    ],
  }).limit(limit);
  return products;
};

const getAllInventory = async ({ page = 1, limit = 50, search = '', searchBy = 'all', sortBy = 'location', sortOrder = 'asc' }) => {
  const query = {};
  if (search) {
    const regex = { $regex: search, $options: 'i' };
    if (searchBy === 'part_no') {
      query.part_no = regex;
    } else if (searchBy === 'barcode') {
      query.barcode = regex;
    } else if (searchBy === 'description') {
      query.description = regex;
    } else if (searchBy === 'location') {
      query.location = regex;
    } else {
      query.$or = [
        { part_no: regex },
        { barcode: regex },
        { description: regex },
        { location: regex }
      ];
    }
  }
  const skip = (page - 1) * limit;

  const sortDirection = sortOrder === 'desc' ? -1 : 1;
  const sortObj = {};
  sortObj[sortBy] = sortDirection;

  const [items, total] = await Promise.all([
    Inventory.find(query).sort(sortObj).skip(skip).limit(limit),
    Inventory.countDocuments(query),
  ]);
  return { items, total, page, limit };
};

const incrementInventoryVersion = async (adminId, description, fileName = 'Manual Edit') => {
  const newVersion = await generateNextVersion();
  await InventoryVersion.updateMany({}, { is_active: false });
  const totalCount = await Inventory.countDocuments({});
  await InventoryVersion.create({
    version: newVersion,
    total_products: totalCount,
    imported_by: adminId,
    file_name: fileName,
    is_active: true,
  });
  await ActivityLog.create({
    user_id: adminId,
    event_type: 'INVENTORY_IMPORTED',
    description: `Inventory version updated to ${newVersion}: ${description}`,
    metadata: { version: newVersion, total_products: totalCount, file_name: fileName },
  });

  // Send FCM push notification to devices
  await fcmService.sendTopicNotification('inventory_updates', {
    notification: {
      title: 'Location Data Updated',
      body: `Inventory locations updated to version ${newVersion}. Sync now for latest data.`,
    },
    data: {
      type: 'INVENTORY_UPDATE',
      version: newVersion,
    }
  });
};

const updateInventoryItem = async (id, data, adminId) => {
  const item = await Inventory.findByIdAndUpdate(id, data, { new: true });
  if (!item) throw new AppError('Inventory item not found', 404, 'INVENTORY_NOT_FOUND');
  await incrementInventoryVersion(adminId, `Updated part ${item.part_no}`);
  return item;
};

const deleteInventoryItem = async (id, adminId) => {
  const item = await Inventory.findByIdAndDelete(id);
  if (!item) throw new AppError('Inventory item not found', 404, 'INVENTORY_NOT_FOUND');
  await incrementInventoryVersion(adminId, `Deleted part ${item.part_no}`);
  return item;
};

module.exports = { 
  importInventory, 
  getCurrentVersion, 
  downloadInventory, 
  findByBarcode, 
  findByPartNo, 
  searchInventory, 
  getAllInventory,
  updateInventoryItem,
  deleteInventoryItem
};
