const express = require('express');
const router = express.Router();
const partsMasterController = require('./parts-master.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const roleMiddleware = require('../../middleware/role.middleware');

router.use(authMiddleware);

// All authenticated users can view Parts Master
router.get('/', partsMasterController.getParts);

// Only admin and stock_manager can edit Parts Master
router.patch('/:partNo', roleMiddleware(['admin', 'stock_manager']), partsMasterController.updatePart);

module.exports = router;
