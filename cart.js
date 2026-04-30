const cartItemsContainer = document.getElementById('cartItems');
const cartSubtotalEl = document.getElementById('cartSubtotal');
const checkoutBtn = document.getElementById('checkoutBtn');

const renderCart = async () => {
  if (!cartItemsContainer || !cartSubtotalEl) return;
  try {
    const token = getToken();
    let cartItems = [];
    if (token) {
      const response = await fetch(`${apiBase}/cart`, { headers: getAuthHeaders() });
      cartItems = await response.json();
    } else {
      const localCart = JSON.parse(localStorage.getItem('ecom_cart') || '[]');
      cartItems = await Promise.all(localCart.map(async (item) => {
        const productRes = await fetch(`${apiBase}/products/${item.product_id}`);
        const data = await productRes.json();
        return { id: item.product_id, quantity: item.quantity, Product: data.product };
      }));
    }
    let subtotal = 0;
    cartItemsContainer.innerHTML = cartItems.map((item) => {
      const product = item.Product;
      subtotal += product.price * item.quantity;
      return `
        <div class="cart-item">
          <img src="${product.image}" alt="${product.name}" />
          <div class="cart-item-details">
            <h4>${product.name}</h4>
            <p>${formatCurrency(product.price)} each</p>
            <div class="quantity-control">
              <button onclick="changeQuantity(${item.id}, ${item.quantity - 1})">-</button>
              <span>${item.quantity}</span>
              <button onclick="changeQuantity(${item.id}, ${item.quantity + 1})">+</button>
            </div>
          </div>
          <div class="cart-actions">
            <strong>${formatCurrency(product.price * item.quantity)}</strong>
            <button class="button button--secondary" onclick="removeCartItem(${item.id})">Remove</button>
          </div>
        </div>
      `;
    }).join('');
    cartSubtotalEl.textContent = formatCurrency(subtotal);
    updateCartCount();
  } catch (error) {
    console.error(error);
    cartItemsContainer.innerHTML = '<p>Unable to load cart.</p>';
  }
};

window.changeQuantity = async (itemId, quantity) => {
  const token = getToken();
  if (!token) {
    const cart = JSON.parse(localStorage.getItem('ecom_cart') || '[]');
    const item = cart.find((entry) => entry.product_id === itemId);
    if (item) {
      item.quantity = Math.max(1, quantity);
      localStorage.setItem('ecom_cart', JSON.stringify(cart));
      showToast('Cart updated');
      renderCart();
    }
    return;
  }
  try {
    await fetch(`${apiBase}/cart/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ quantity }),
    });
    renderCart();
  } catch (error) {
    console.error(error);
  }
};

window.removeCartItem = async (itemId) => {
  const token = getToken();
  if (!token) {
    const cart = JSON.parse(localStorage.getItem('ecom_cart') || '[]').filter((item) => item.product_id !== itemId);
    localStorage.setItem('ecom_cart', JSON.stringify(cart));
    showToast('Removed from cart');
    renderCart();
    return;
  }
  try {
    await fetch(`${apiBase}/cart/${itemId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    showToast('Removed from cart');
    renderCart();
  } catch (error) {
    console.error(error);
  }
};

checkoutBtn?.addEventListener('click', () => {
  window.location.href = 'checkout.html';
});

document.addEventListener('DOMContentLoaded', renderCart);
