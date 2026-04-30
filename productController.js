const { Product, Review, User } = require('../models');
const { Op } = require('sequelize');

exports.getProducts = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, rating, sort } = req.query;
    const where = {};
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }
    if (category) {
      where.category = category;
    }
    if (rating) {
      where.rating = { [Op.gte]: parseFloat(rating) };
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }
    let order = [['created_at', 'DESC']];
    if (sort === 'low') order = [['price', 'ASC']];
    if (sort === 'high') order = [['price', 'DESC']];
    const products = await Product.findAll({ where, order });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch products.' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Review, include: [{ model: User, attributes: ['name'] }] }],
    });
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    const related = await Product.findAll({ where: { category: product.category, id: { [Op.ne]: product.id } }, limit: 4 });
    res.json({ product, related });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch product details.' });
  }
};

exports.addReview = async (req, res) => {
  try {
    const { rating, comment, image } = req.body;
    const productId = req.params.id;
    const user = req.user;
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    const review = await Review.create({
      user_id: user.id,
      product_id: productId,
      rating: parseInt(rating, 10) || 5,
      comment: comment || '',
      image: image || null,
    });
    res.status(201).json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to submit review.' });
  }
};

exports.getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const suggestions = await Product.findAll({
      where: { name: { [Op.like]: `%${q}%` } },
      limit: 8,
      attributes: ['id', 'name', 'image', 'price'],
    });
    res.json(suggestions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch suggestions.' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, price, description, image, category, rating, stock } = req.body;
    const product = await Product.create({ name, price, description, image, category, rating, stock });
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to create product.' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    await product.update(req.body);
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to update product.' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    await product.destroy();
    res.json({ message: 'Product deleted.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to delete product.' });
  }
};
