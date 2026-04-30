const bcrypt = require('bcrypt');
const User = require('./models/User');
const Product = require('./models/Product');
const Review = require('./models/Review');
const Coupon = require('./models/Coupon');

const sampleProducts = [
  {
    name: 'Premium Noise-Canceling Headphones',
    price: 198.99,
    description: 'Experience immersive sound and premium comfort with adaptive noise cancellation.',
    image: 'https://images.unsplash.com/photo-1512446733611-9099a758eaf5?auto=format&fit=crop&w=800&q=80',
    category: 'Electronics',
    rating: 4.8,
  },
  {
    name: 'Smart Home Speaker with Alexa',
    price: 64.99,
    description: 'Voice-controlled speaker for music, smart home automation, and quick answers.',
    image: 'https://images.unsplash.com/photo-1563964194564-2caf3a9b39eb?auto=format&fit=crop&w=800&q=80',
    category: 'Smart Home',
    rating: 4.6,
  },
  {
    name: 'Ultra Slim Laptop Stand',
    price: 35.5,
    description: 'Aluminum laptop stand designed for ergonomic comfort and modern workspace style.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    category: 'Office',
    rating: 4.4,
  },
  {
    name: 'Fitness Tracker Smartwatch',
    price: 99.0,
    description: 'Track your heart rate, workouts, and sleep with a sleek fitness companion.',
    image: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=800&q=80',
    category: 'Wearables',
    rating: 4.5,
  },
  {
    name: 'Wireless Gaming Mouse',
    price: 45.75,
    description: 'High-precision wireless gaming mouse with customizable RGB lighting.',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    category: 'Gaming',
    rating: 4.7,
  },
  {
    name: 'Modern Ceramic Coffee Mug Set',
    price: 29.99,
    description: 'A premium set of ceramic mugs with a minimalist design and durable finish.',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    category: 'Home',
    rating: 4.3,
  }
];

const sampleReviews = [
  {
    user_id: 1,
    product_id: 1,
    rating: 5,
    comment: 'The sound quality is unbelievable and the noise cancellation is top tier.',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
  },
  {
    user_id: 1,
    product_id: 4,
    rating: 4,
    comment: 'Comfortable screen and accurate tracking for workouts.',
    image: null,
  }
];

const createAdminUser = async (adminEmail) => {
  const existing = await User.findOne({ where: { email: adminEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'Admin',
      email: adminEmail,
      password: passwordHash,
      is_admin: true,
      address: 'Admin Warehouse, Main Street 1',
    });
  }
};

const createSampleProducts = async () => {
  const count = await Product.count();
  if (count > 0) return;
  const created = await Product.bulkCreate(sampleProducts);
  await Review.bulkCreate(
    sampleReviews.map((review) => ({
      ...review,
      user_id: 1,
    }))
  );
  return created;
};

const createSampleCoupons = async () => {
  const count = await Coupon.count();
  if (count > 0) return;
  await Coupon.bulkCreate([
    {
      code: 'SAVE10',
      discount_percent: 10,
      min_total: 30,
      expires_at: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      active: true,
    },
    {
      code: 'FREESHIP',
      discount_percent: 7,
      min_total: 50,
      expires_at: new Date(new Date().setMonth(new Date().getMonth() + 2)),
      active: true,
    },
  ]);
};

module.exports = {
  createAdminUser,
  createSampleProducts,
  createSampleCoupons,
};
