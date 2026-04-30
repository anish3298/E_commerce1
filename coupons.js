const express = require('express');
const router = express.Router();
const { applyCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon } = require('../controllers/couponController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/apply', applyCoupon);
router.get('/admin', protect, adminOnly, getCoupons);
router.post('/admin', protect, adminOnly, createCoupon);
router.put('/admin/:id', protect, adminOnly, updateCoupon);
router.delete('/admin/:id', protect, adminOnly, deleteCoupon);

module.exports = router;
