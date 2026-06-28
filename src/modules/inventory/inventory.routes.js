const express = require('express');
const router = express.Router();
const inventoryController = require('./inventory.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const adminMiddleware = require('../../middleware/admin.middleware');

// All routes require auth
router.use(authMiddleware);

// GET /api/inventory/version  - mobile version check
router.get('/version', inventoryController.getCurrentVersion);

// GET /api/inventory/download  - mobile full download
router.get('/download', inventoryController.downloadInventory);

// GET /api/inventory/barcode/:barcode  - scan to find
router.get('/barcode/:barcode', inventoryController.findByBarcode);

// GET /api/inventory/search?q=  - text search
router.get('/search', inventoryController.searchInventory);

// GET /api/inventory  - admin paginated list
router.get('/', adminMiddleware, inventoryController.getAllInventory);

// POST /api/inventory/import  - admin Excel import
router.post('/import', adminMiddleware, inventoryController.importInventory);

module.exports = router;
