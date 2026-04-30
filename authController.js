const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, is_admin: user.is_admin },
    process.env.JWT_SECRET || 'supersecretjwtkey',
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, address } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill all required fields.' });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, address });
    res.status(201).json({ token: generateToken(user), user: { id: user.id, name: user.name, email: user.email, address: user.address } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to register user.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email or password.' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    res.json({ token: generateToken(user), user: { id: user.id, name: user.name, email: user.email, address: user.address, is_admin: user.is_admin } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to login.' });
  }
};
