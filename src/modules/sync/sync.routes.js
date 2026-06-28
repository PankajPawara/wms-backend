const express = require('express');
const router = express.Router();
const syncController = require('./sync.controller');
const authMiddleware = require('../../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/status', syncController.getSyncStatus);
router.post('/orders', syncController.syncOrders);
router.post('/order-items', syncController.syncOrderItems);

module.exports = router;
