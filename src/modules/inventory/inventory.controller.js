const multer = require('multer');
const path = require('path');
const env = require('../../config/env');
const inventoryService = require('./inventory.service');
const { successResponse, paginatedResponse } = require('../../utils/response.util');
const AppError = require('../../utils/error.util');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, env.UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `inventory_${Date.now()}${ext}`);
  },
});
const fileFilter = (req, file, cb) => {
  const allowed = ['.xlsx', '.xls', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new AppError('Only .xlsx, .xls, .csv files are allowed', 422, 'INVENTORY_IMPORT_FAILED'));
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
}).single('file');

const importInventory = async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) return next(err instanceof AppError ? err : new AppError(err.message, 422, 'INVENTORY_IMPORT_FAILED'));
    if (!req.file) return next(new AppError('No file uploaded', 400, 'VALIDATION_ERROR'));
    try {
      const version = await inventoryService.importInventory(
        req.file.path,
        req.file.originalname,
        req.user._id
      );
      return res.status(200).json(successResponse('Inventory imported successfully', { version }));
    } catch (err) {
      next(err);
    }
  });
};

const getCurrentVersion = async (req, res, next) => {
  try {
    const version = await inventoryService.getCurrentVersion();
    return res.status(200).json(successResponse('Version fetched', { version: version ? version.version : 'v0', total_products: version ? version.total_products : 0, imported_at: version ? version.createdAt : null }));
  } catch (err) { next(err); }
};

const downloadInventory = async (req, res, next) => {
  try {
    const data = await inventoryService.downloadInventory();
    return res.status(200).json(successResponse('Inventory downloaded', data));
  } catch (err) { next(err); }
};

const findByBarcode = async (req, res, next) => {
  try {
    const product = await inventoryService.findByBarcode(req.params.barcode);
    return res.status(200).json(successResponse('Product found', { product }));
  } catch (err) { next(err); }
};

const searchInventory = async (req, res, next) => {
  try {
    const { q, limit = 20 } = req.query;
    if (!q) return next(new AppError('Search query is required', 400, 'VALIDATION_ERROR'));
    const products = await inventoryService.searchInventory(q, parseInt(limit));
    return res.status(200).json(successResponse('Search results', { products, total: products.length }));
  } catch (err) { next(err); }
};

const getAllInventory = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const result = await inventoryService.getAllInventory({ page: parseInt(page), limit: parseInt(limit), search });
    return res.status(200).json(paginatedResponse('Inventory fetched', result.items, result.total, result.page, result.limit));
  } catch (err) { next(err); }
};

const updateInventoryItem = async (req, res, next) => {
  try {
    const item = await inventoryService.updateInventoryItem(req.params.id, req.body, req.user._id);
    return res.status(200).json(successResponse('Inventory item updated successfully', { item }));
  } catch (err) { next(err); }
};

const deleteInventoryItem = async (req, res, next) => {
  try {
    const item = await inventoryService.deleteInventoryItem(req.params.id, req.user._id);
    return res.status(200).json(successResponse('Inventory item deleted successfully', { item }));
  } catch (err) { next(err); }
};

module.exports = { 
  importInventory, 
  getCurrentVersion, 
  downloadInventory, 
  findByBarcode, 
  searchInventory, 
  getAllInventory,
  updateInventoryItem,
  deleteInventoryItem
};
