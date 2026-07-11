const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const authMiddleware = require('../../middleware/auth.middleware');

// Public route to submit password reset request (so a logged out user can click "Forgot Password?")
router.post('/reset-request', notificationController.requestReset);

// Protected routes (require login)
router.use(authMiddleware);

router.get('/', notificationController.getNotifications);
router.post('/read-all', notificationController.readAllNotifications);
router.patch('/:id/action', notificationController.actionReset); // Admin actions to approve/reject

module.exports = router;
