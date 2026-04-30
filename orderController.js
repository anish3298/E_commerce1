const PDFDocument = require('pdfkit');
const { Order, OrderItem, CartItem, Product, Coupon } = require('../models');
const INR_RATE = 83.5;
const formatCurrencyINR = (value) => `₹${(Number(value) * INR_RATE).toFixed(2)}`;

exports.placeOrder = async (req, res) => {
  try {
    const { address, shipping_method = 'Standard Delivery', coupon_code, payment_method = 'UPI' } = req.body;
    const user_id = req.user.id;

    const cartItems = await CartItem.findAll({ where: { user_id }, include: [{ model: Product }] });
    if (!cartItems.length) return res.status(400).json({ message: 'Cart is empty.' });

    let total_price = cartItems.reduce((sum, item) => sum + item.quantity * item.Product.price, 0);
    let discount_amount = 0;
    let couponCode = null;
    let payment_status = payment_method === 'Card' ? 'Paid' : 'Pending';

    if (coupon_code) {
      const coupon = await Coupon.findOne({ where: { code: coupon_code.trim().toUpperCase(), active: true } });
      if (coupon) {
        if (!coupon.expires_at || coupon.expires_at >= new Date()) {
          if (total_price >= coupon.min_total) {
            discount_amount = Number(((total_price * coupon.discount_percent) / 100).toFixed(2));
            total_price = Number((total_price - discount_amount).toFixed(2));
            couponCode = coupon.code;
          }
        }
      }
    }

    const order = await Order.create({
      user_id,
      total_price,
      address,
      shipping_method,
      coupon_code: couponCode,
      discount_amount,
      payment_method,
      payment_status,
    });

    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.Product.price,
    }));
    await OrderItem.bulkCreate(orderItems);
    await CartItem.destroy({ where: { user_id } });

    res.status(201).json({ message: 'Order placed successfully.', orderId: order.id, total_price, discount_amount, coupon_code: couponCode, payment_method, payment_status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to place order.' });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      include: [{ model: OrderItem, include: [Product] }],
    });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch orders.' });
  }
};

exports.getOrderInvoice = async (req, res) => {
  try {
    const order = await Order.findOne({ where: { id: req.params.id, user_id: req.user.id }, include: [{ model: OrderItem, include: [Product] }] });
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-disposition', `attachment; filename=invoice-${order.id}.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    doc.fontSize(20).text('Order Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Order ID: ${order.id}`);
    doc.text(`Status: ${order.status}`);
    doc.text(`Payment method: ${order.payment_method}`);
    doc.text(`Payment status: ${order.payment_status}`);
    if (order.coupon_code) {
      doc.text(`Coupon: ${order.coupon_code}`);
      doc.text(`Discount: ${formatCurrencyINR(order.discount_amount)}`);
    }
    doc.text(`Ship To: ${order.address}`);
    doc.text(`Total: ${formatCurrencyINR(order.total_price)}`);
    doc.moveDown();
    doc.text('Items:', { underline: true });
    order.OrderItems.forEach((item) => {
      doc.text(`${item.quantity} x ${item.Product.name} — ${formatCurrencyINR(item.price)}`);
    });
    doc.end();
    doc.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to create invoice.' });
  }
};
