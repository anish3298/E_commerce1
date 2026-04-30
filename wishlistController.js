const { Wishlist, Product } = require('../models');

exports.getWishlist = async (req, res) => {
  try {
    const wishlistItems = await Wishlist.findAll({ where: { user_id: req.user.id } });
    const productIds = wishlistItems.map((item) => item.product_id);
    const products = await Product.findAll({ where: { id: productIds } });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch wishlist.' });
  }
};

exports.addWishlist = async (req, res) => {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ message: 'Product ID is required.' });

    const existing = await Wishlist.findOne({ where: { user_id: req.user.id, product_id } });
    if (existing) return res.status(400).json({ message: 'Product already in wishlist.' });

    const item = await Wishlist.create({ user_id: req.user.id, product_id });
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to add to wishlist.' });
  }
};

exports.removeWishlist = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    if (!productId) return res.status(400).json({ message: 'Product ID is required.' });

    const item = await Wishlist.findOne({ where: { user_id: req.user.id, product_id: productId } });
    if (!item) return res.status(404).json({ message: 'Wishlist item not found.' });

    await item.destroy();
    res.json({ message: 'Product removed from wishlist.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to remove from wishlist.' });
  }
};
