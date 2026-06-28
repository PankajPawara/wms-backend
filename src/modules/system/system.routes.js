const express = require('express');
const router = express.Router();
const systemController = require('./system.controller');
const authMiddleware = require('../../middleware/auth.middleware');

router.get('/health', systemController.healthCheck);
router.get('/info', authMiddleware, systemController.getSystemInfo);

module.exports = router;
