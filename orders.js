const express = require('express');
const router = express.Router();
const { placeOrder, getUserOrders, getOrderInvoice } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/', placeOrder);
router.get('/user', getUserOrders);
router.get('/:id/invoice', getOrderInvoice);

module.exports = router;
