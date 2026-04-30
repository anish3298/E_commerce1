const { Product, Order, User } = require('../models');
const { Op } = require('sequelize');

exports.dashboard = async (req, res) => {
  try {
    const totalSales = await Order.sum('total_price');
    const ordersCount = await Order.count();
    const topProducts = await Product.findAll({ order: [['rating', 'DESC']], limit: 5 });
    const customers = await User.count({ where: { is_admin: false } });
    res.json({ totalSales, ordersCount, topProducts, customers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch dashboard data.' });
  }
};
