exports.chatbot = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ reply: 'Please type a question so I can help.' });

    const text = message.toLowerCase();
    let reply = 'I can help with orders, coupons, shipping, returns, and product recommendations. What would you like to know?';

    if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
      reply = 'Hello! I am your shopping assistant. Ask me about coupons, order delivery, or product recommendations.';
    } else if (text.includes('order') || text.includes('status') || text.includes('track')) {
      reply = 'You can view order status and download invoices on the Orders page. Need help finding an order?';
    } else if (text.includes('coupon') || text.includes('discount') || text.includes('save') || text.includes('deal')) {
      reply = 'Our current coupons include SAVE10 for 10% off and FREESHIP for free shipping above $50. Enter codes at checkout to apply savings.';
    } else if (text.includes('shipping') || text.includes('delivery')) {
      reply = 'Most orders ship within 3-5 days. Delivery updates appear in your order history. For express delivery, choose premium shipping during checkout.';
    } else if (text.includes('return') || text.includes('refund')) {
      reply = 'Need a return or refund? Please contact support@anishshop.com and include your order number so our team can help you quickly.';
    } else if (text.includes('recommend') || text.includes('suggest')) {
      reply = 'Browse our Best Sellers and homepage featured collections for expertly curated product picks. I can also help you find gifts, tech, or fashion.';
    } else if (text.includes('payment') || text.includes('checkout')) {
      reply = 'We accept secure payments and support checkout with saved addresses. Use the cart icon to review items and proceed to payment.';
    }

    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: 'Sorry, I could not process that request right now.' });
  }
};
