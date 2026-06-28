const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { loginSchema, changePasswordSchema } = require('./auth.validation');

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/change-password  (auth required)
router.post('/change-password', authMiddleware, validate(changePasswordSchema), authController.changePassword);

// GET /api/auth/me  (auth required)
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
