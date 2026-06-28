const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { createOrderSchema, updateStatusSchema } = require('./order.validation');

router.use(authMiddleware);

router.get('/stats', orderController.getStats);
router.get('/', orderController.getOrders);
router.post('/', validate(createOrderSchema), orderController.createOrder);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/status', validate(updateStatusSchema), orderController.updateOrderStatus);
router.patch('/:id/items/:itemId', orderController.updateOrderItem);

module.exports = router;
