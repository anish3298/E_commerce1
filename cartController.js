const { CartItem, Product } = require('../models');

exports.addToCart = async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const user_id = req.user.id;
    const existing = await CartItem.findOne({ where: { user_id, product_id } });
    if (existing) {
      existing.quantity += quantity;
      await existing.save();
      return res.json(existing);
    }
    const item = await CartItem.create({ user_id, product_id, quantity });
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to add to cart.' });
  }
};

exports.getCart = async (req, res) => {
  try {
    const cartItems = await CartItem.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Product }],
    });
    res.json(cartItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch cart.' });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const cartItem = await CartItem.findOne({ where: { id: itemId, user_id: req.user.id } });
    if (!cartItem) return res.status(404).json({ message: 'Cart item not found.' });
    cartItem.quantity = Math.max(1, parseInt(quantity, 10));
    await cartItem.save();
    res.json(cartItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to update cart item.' });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const cartItem = await CartItem.findOne({ where: { id: itemId, user_id: req.user.id } });
    if (!cartItem) return res.status(404).json({ message: 'Cart item not found.' });
    await cartItem.destroy();
    res.json({ message: 'Removed from cart.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to remove cart item.' });
  }
};
