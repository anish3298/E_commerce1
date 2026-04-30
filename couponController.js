const { Coupon } = require('../models');

exports.applyCoupon = async (req, res) => {
  try {
    const { code, total } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code is required.' });
    const coupon = await Coupon.findOne({ where: { code: code.trim().toUpperCase(), active: true } });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found.' });
    if (coupon.expires_at && coupon.expires_at < new Date()) {
      return res.status(400).json({ message: 'Coupon has expired.' });
    }
    if (parseFloat(total) < coupon.min_total) {
      return res.status(400).json({ message: `Minimum order total is $${coupon.min_total.toFixed(2)}.` });
    }
    const discount = Number(((total * coupon.discount_percent) / 100).toFixed(2));
    res.json({
      code: coupon.code,
      discount,
      discount_percent: coupon.discount_percent,
      min_total: coupon.min_total,
      total: Number(total),
      new_total: Number((total - discount).toFixed(2)),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to apply coupon.' });
  }
};

exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
    res.json(coupons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch coupons.' });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const { code, discount_percent, min_total, expires_at, active } = req.body;
    if (!code || !discount_percent || min_total === undefined) {
      return res.status(400).json({ message: 'Code, discount percent, and minimum order total are required.' });
    }
    const normalizedCode = code.trim().toUpperCase();
    const expiresAt = expires_at ? new Date(expires_at) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return res.status(400).json({ message: 'Invalid expiration date.' });
    }
    const coupon = await Coupon.create({
      code: normalizedCode,
      discount_percent: Number(discount_percent),
      min_total: Number(min_total),
      expires_at: expiresAt,
      active: active === false ? false : active === 'false' ? false : !!active,
    });
    res.status(201).json(coupon);
  } catch (error) {
    console.error(error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Coupon code already exists.' });
    }
    res.status(500).json({ message: 'Unable to create coupon.' });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { discount_percent, min_total, expires_at, active } = req.body;
    const coupon = await Coupon.findByPk(id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found.' });
    const expiresAt = expires_at ? new Date(expires_at) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return res.status(400).json({ message: 'Invalid expiration date.' });
    }
    await coupon.update({
      discount_percent: discount_percent !== undefined ? Number(discount_percent) : coupon.discount_percent,
      min_total: min_total !== undefined ? Number(min_total) : coupon.min_total,
      expires_at: expires_at !== undefined ? expiresAt : coupon.expires_at,
      active: active !== undefined ? (active === false ? false : active === 'false' ? false : !!active) : coupon.active,
    });
    res.json(coupon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to update coupon.' });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByPk(id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found.' });
    await coupon.destroy();
    res.json({ message: 'Coupon removed successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to delete coupon.' });
  }
};
