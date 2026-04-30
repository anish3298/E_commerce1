const checkoutForm = document.getElementById('checkoutForm');
const checkoutItemsContainer = document.getElementById('checkoutItems');
const checkoutTotalEl = document.getElementById('checkoutTotal');
const couponCodeInput = document.getElementById('couponCode');
const applyCouponBtn = document.getElementById('applyCoupon');
const couponMessageEl = document.getElementById('couponMessage');
const upiDetails = document.getElementById('upiDetails');
let appliedCoupon = null;
let currentTotal = 0;
let selectedPaymentMethod = 'UPI';

const updateCheckoutSummary = () => {
  if (!checkoutTotalEl) return;
  if (appliedCoupon && appliedCoupon.discount) {
    checkoutTotalEl.textContent = formatCurrency(appliedCoupon.new_total);
    couponMessageEl.textContent = `Coupon ${appliedCoupon.code} applied: -${formatCurrency(appliedCoupon.discount)}`;
  } else {
    checkoutTotalEl.textContent = formatCurrency(currentTotal);
    couponMessageEl.textContent = '';
  }
};

const loadCheckoutItems = async () => {
  if (!checkoutItemsContainer || !checkoutTotalEl) return;
  try {
    const token = getToken();
    if (!token) {
      showToast('Please login to proceed to checkout');
      window.location.href = 'index.html';
      return;
    }
    const response = await fetch(`${apiBase}/cart`, { headers: getAuthHeaders() });
    const cartItems = await response.json();
    let total = 0;
    checkoutItemsContainer.innerHTML = cartItems.map((item) => {
      total += item.quantity * item.Product.price;
      return `
        <div class="summary-row">
          <span>${item.quantity} x ${item.Product.name}</span>
          <strong>${formatCurrency(item.quantity * item.Product.price)}</strong>
        </div>
      `;
    }).join('');
    currentTotal = total;
    updateCheckoutSummary();
    const user = getUser();
    if (user) {
      document.getElementById('checkoutName').value = user.name;
      document.getElementById('checkoutEmail').value = user.email;
      document.getElementById('checkoutAddress').value = user.address || '';
    }
  } catch (error) {
    console.error(error);
    checkoutItemsContainer.innerHTML = '<p>Unable to load checkout details.</p>';
  }
};

const updatePaymentVisibility = () => {
  if (!upiDetails) return;
  upiDetails.style.display = selectedPaymentMethod === 'UPI' ? 'block' : 'none';
};

const initPaymentSelection = () => {
  const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
  paymentRadios.forEach((radio) => {
    radio.addEventListener('change', (event) => {
      selectedPaymentMethod = event.target.value;
      updatePaymentVisibility();
    });
  });
  updatePaymentVisibility();
};

const applyCoupon = async () => {
  const code = couponCodeInput?.value.trim();
  if (!code) {
    showToast('Enter a coupon code first.');
    return;
  }
  try {
    const response = await fetch(`${apiBase}/coupons/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ code, total: currentTotal }),
    });
    const result = await response.json();
    if (!response.ok) {
      couponMessageEl.textContent = result.message || 'Invalid coupon';
      appliedCoupon = null;
      updateCheckoutSummary();
      return;
    }
    appliedCoupon = result;
    updateCheckoutSummary();
    showToast(`Coupon ${result.code} applied!`);
  } catch (error) {
    console.error(error);
    showToast('Unable to validate coupon');
  }
};

checkoutForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const address = document.getElementById('checkoutAddress').value.trim();
  if (!address) {
    showToast('Please enter a valid shipping address.');
    return;
  }
  try {
    const requestBody = {
      address,
      coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
      payment_method: selectedPaymentMethod,
    };
    const response = await fetch(`${apiBase}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(requestBody),
    });
    const result = await response.json();
    if (!response.ok) {
      showToast(result.message || 'Unable to place order');
      return;
    }
    if (selectedPaymentMethod === 'UPI') {
      showToast('Order created. Complete payment via UPI and check your order page.');
    } else {
      showToast('Order placed successfully');
    }
    localStorage.removeItem('ecom_cart');
    setTimeout(() => {
      window.location.href = 'order-history.html';
    }, 1200);
  } catch (error) {
    console.error(error);
    showToast('Order submission failed');
  }
});

applyCouponBtn?.addEventListener('click', applyCoupon);

document.addEventListener('DOMContentLoaded', () => {
  initPaymentSelection();
  loadCheckoutItems();
});
