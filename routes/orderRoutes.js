const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authenticate = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

router.post('/', authenticate, orderController.createOrder);
router.get('/', authenticate, orderController.getUserOrders);
router.get('/:id', authenticate, orderController.getOrderById);
router.put('/:id/status', authenticate, adminOnly, orderController.updateOrderStatus);
router.put('/:id/payment', authenticate, adminOnly, orderController.updateOrderStatus);

module.exports = router;
