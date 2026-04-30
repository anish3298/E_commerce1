const apiBase = '/api';
const currencyRate = 83.5; // USD to INR conversion rate
const currencySymbol = '₹';
const formatCurrency = (value) => `${currencySymbol}${(Number(value) * currencyRate).toFixed(2)}`;
window.formatCurrency = formatCurrency;
window.currencySymbol = currencySymbol;
const toastEl = document.getElementById('toast');
const authModal = document.getElementById('authModal');
const authForm = document.getElementById('authForm');
const closeModalBtn = document.getElementById('closeModal');
const loginTrigger = document.getElementById('loginTrigger');
const searchInput = document.getElementById('searchInput');
const suggestionsBox = document.getElementById('suggestions');
const cartCountEl = document.getElementById('cartCount');
const categoryFilter = document.getElementById('categoryFilter');
const authTabs = document.querySelectorAll('.tab');
let activeAuthTab = 'login';

const showToast = (message) => {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2400);
};

const getToken = () => localStorage.getItem('ecom_token');
const setToken = (token) => localStorage.setItem('ecom_token', token);
const getUser = () => JSON.parse(localStorage.getItem('ecom_user') || 'null');
const setUser = (user) => localStorage.setItem('ecom_user', JSON.stringify(user));
const removeUser = () => {
  localStorage.removeItem('ecom_token');
  localStorage.removeItem('ecom_user');
};

const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const buildProductCard = (product, showWishlist = true) => {
  const imageUrl = product.image || 'https://via.placeholder.com/420x320?text=No+Image';
  return `
    <article class="product-card">
      <img src="${imageUrl}" alt="${product.name}" />
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.category}</p>
        <div class="product-meta">
          <span>${formatCurrency(product.price)}</span>
          <span>⭐ ${product.rating}</span>
        </div>
        <div class="card-actions">
          <button class="button button--secondary" onclick="location.href='product.html?id=${product.id}'">View</button>
          <button class="icon-button" onclick="addToCart(${product.id}, this)">🛒</button>
          ${showWishlist ? `<button class="icon-button" onclick="addToWishlist(${product.id}, this)">❤️</button>` : ''}
        </div>
      </div>
    </article>
  `;
};

const getQueryParam = (name) => new URLSearchParams(window.location.search).get(name);

const openAuthModal = () => {
  if (!authModal) return;
  authModal.classList.add('active');
  renderAuthForm();
};

const closeAuthModal = () => {
  if (!authModal) return;
  authModal.classList.remove('active');
};

const renderAuthForm = () => {
  if (!authForm) return;
  authForm.innerHTML = '';
  const fields = [
    { name: 'email', type: 'email', label: 'Email' },
    { name: 'password', type: 'password', label: 'Password' }
  ];
  if (activeAuthTab === 'register') {
    fields.unshift({ name: 'name', type: 'text', label: 'Name' });
    fields.push({ name: 'address', type: 'text', label: 'Delivery address' });
  }
  fields.forEach((field) => {
    const label = document.createElement('label');
    label.textContent = field.label;
    const input = document.createElement('input');
    input.type = field.type;
    input.name = field.name;
    input.required = true;
    input.placeholder = field.label;
    label.appendChild(input);
    authForm.appendChild(label);
  });
  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'button button--primary';
  button.textContent = activeAuthTab === 'login' ? 'Login' : 'Create account';
  authForm.appendChild(button);
};

const handleAuthSubmit = async (event) => {
  event.preventDefault();
  const data = new FormData(authForm);
  const payload = Object.fromEntries(data.entries());
  const endpoint = activeAuthTab === 'login' ? 'login' : 'register';
  try {
    const response = await fetch(`${apiBase}/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      showToast(result.message || 'Authentication failed');
      return;
    }
    setToken(result.token);
    setUser(result.user);
    closeAuthModal();
    showToast('Welcome back!');
    syncLocalCart();
    updateCartCount();
  } catch (error) {
    console.error(error);
    showToast('Unable to connect to server');
  }
};

const updateCartCount = async () => {
  if (!cartCountEl) return;
  const token = getToken();
  if (token) {
    try {
      const response = await fetch(`${apiBase}/cart`, { headers: getAuthHeaders() });
      const items = await response.json();
      const count = items.reduce((sum, item) => sum + item.quantity, 0);
      cartCountEl.textContent = count;
      localStorage.setItem('local_cart_count', count);
      return;
    } catch (error) {
      console.error(error);
    }
  }
  const localCart = JSON.parse(localStorage.getItem('ecom_cart') || '[]');
  const count = localCart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountEl.textContent = count;
};

const syncLocalCart = async () => {
  const token = getToken();
  if (!token) return;
  const localCart = JSON.parse(localStorage.getItem('ecom_cart') || '[]');
  if (!localCart.length) return;
  for (const item of localCart) {
    try {
      await fetch(`${apiBase}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ product_id: item.product_id, quantity: item.quantity }),
      });
    } catch (error) {
      console.error('Sync failed', error);
    }
  }
  localStorage.removeItem('ecom_cart');
};

window.addToCart = async (productId, button) => {
  const payload = { product_id: productId, quantity: 1 };
  try {
    if (getToken()) {
      await fetch(`${apiBase}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
    } else {
      const cart = JSON.parse(localStorage.getItem('ecom_cart') || '[]');
      const existing = cart.find((item) => item.product_id === productId);
      if (existing) existing.quantity += 1;
      else cart.push(payload);
      localStorage.setItem('ecom_cart', JSON.stringify(cart));
    }
    animateAddToCart(button);
    updateCartCount();
    showToast('Added to cart');
  } catch (error) {
    console.error(error);
    showToast('Unable to add to cart');
  }
};

const addToWishlist = async (productId, button) => {
  if (!getToken()) {
    openAuthModal();
    showToast('Login to save items to your wishlist');
    return;
  }
  try {
    const response = await fetch(`${apiBase}/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ product_id: productId }),
    });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.message || 'Unable to add to wishlist');
      return;
    }
    showToast('Added to wishlist');
    if (button) button.classList.add('active');
  } catch (error) {
    console.error(error);
    showToast('Unable to add to wishlist');
  }
};

const animateAddToCart = (button) => {
  if (!button) return;
  const rect = button.getBoundingClientRect();
  const ball = document.createElement('div');
  ball.style.position = 'fixed';
  ball.style.left = `${rect.left + rect.width / 2}px`;
  ball.style.top = `${rect.top + rect.height / 2}px`;
  ball.style.width = '18px';
  ball.style.height = '18px';
  ball.style.borderRadius = '50%';
  ball.style.background = 'rgba(255,159,28,0.95)';
  ball.style.zIndex = '9999';
  ball.style.pointerEvents = 'none';
  document.body.appendChild(ball);
  const cartRect = cartCountEl ? cartCountEl.getBoundingClientRect() : { left: window.innerWidth - 40, top: 20 };
  ball.animate([
    { transform: 'translate(0,0) scale(1)' },
    { transform: `translate(${cartRect.left - rect.left}px, ${cartRect.top - rect.top}px) scale(0.2)` }
  ], { duration: 700, easing: 'ease-in-out' });
  setTimeout(() => ball.remove(), 700);
};

const createChatWidget = () => {
  const widget = document.createElement('div');
  widget.id = 'chatWidget';
  widget.innerHTML = `
    <button id="chatToggle" class="chat-toggle">Chat</button>
    <div id="chatPanel" class="chat-panel">
      <div class="chat-header">Assistant</div>
      <div id="chatMessages" class="chat-messages"></div>
      <form id="chatForm" class="chat-form">
        <input id="chatInput" type="text" placeholder="Ask about orders, coupons, or delivery" />
        <button type="submit">Send</button>
      </form>
    </div>
  `;
  document.body.appendChild(widget);
  const toggle = document.getElementById('chatToggle');
  const panel = document.getElementById('chatPanel');
  toggle.addEventListener('click', () => panel.classList.toggle('active'));
  const chatForm = document.getElementById('chatForm');
  chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    if (!message) return;
    addChatMessage('You', message);
    chatInput.value = '';
    try {
      const response = await fetch(`${apiBase}/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const result = await response.json();
      addChatMessage('Bot', result.reply);
    } catch (error) {
      console.error(error);
      addChatMessage('Bot', 'Sorry, I could not respond right now.');
    }
  });
};

const addChatMessage = (speaker, text) => {
  const messages = document.getElementById('chatMessages');
  if (!messages) return;
  const item = document.createElement('div');
  item.className = `chat-message ${speaker === 'Bot' ? 'chat-bot' : 'chat-user'}`;
  item.innerHTML = `<strong>${speaker}</strong><p>${text}</p>`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
};

const handleSearchInput = async (event) => {
  const query = event.target.value.trim();
  if (!suggestionsBox) return;
  if (!query) {
    suggestionsBox.classList.remove('active');
    suggestionsBox.innerHTML = '';
    return;
  }
  try {
    const response = await fetch(`${apiBase}/products/search?q=${encodeURIComponent(query)}`);
    const suggestions = await response.json();
    suggestionsBox.innerHTML = suggestions.map((product) => `
      <button onclick="location.href='product.html?id=${product.id}'">
        <img src="${product.image}" alt="${product.name}" width="50" />
        <div>
          <strong>${product.name}</strong>
          <span>${formatCurrency(product.price)}</span>
        </div>
      </button>
    `).join('');
    suggestionsBox.classList.add('active');
  } catch (error) {
    console.error(error);
  }
};

const setActiveAuthTab = (tab) => {
  activeAuthTab = tab;
  authTabs.forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tab);
  });
  renderAuthForm();
};

const setupAuthInteraction = () => {
  if (!loginTrigger || !closeModalBtn || !authModal || !authForm) return;
  loginTrigger.addEventListener('click', (event) => {
    event.preventDefault();
    openAuthModal();
  });
  closeModalBtn.addEventListener('click', closeAuthModal);
  authModal.addEventListener('click', (event) => {
    if (event.target === authModal) closeAuthModal();
  });
  authTabs.forEach((button) => {
    button.addEventListener('click', () => setActiveAuthTab(button.dataset.tab));
  });
  authForm.addEventListener('submit', handleAuthSubmit);
};

const setupGlobalEvents = () => {
  if (searchInput) {
    searchInput.addEventListener('input', handleSearchInput);
    document.addEventListener('click', (event) => {
      if (!suggestionsBox.contains(event.target) && event.target !== searchInput) {
        suggestionsBox.classList.remove('active');
      }
    });
  }
  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
      if (window.location.pathname.endsWith('products.html')) {
        document.getElementById('panelCategory').value = categoryFilter.value;
        document.getElementById('applyFilters').click();
      } else {
        window.location.href = `products.html?category=${encodeURIComponent(categoryFilter.value)}`;
      }
    });
  }
};

const initApp = () => {
  setupAuthInteraction();
  setupGlobalEvents();
  updateCartCount();
  if (getToken()) {
    syncLocalCart();
  }
  createChatWidget();
};

window.openAuthModal = openAuthModal;
window.showToast = showToast;
window.getAuthHeaders = getAuthHeaders;
window.getToken = getToken;
window.getUser = getUser;
window.buildProductCard = buildProductCard;
window.addToWishlist = addToWishlist;
window.apiBase = apiBase;
window.formatCurrency = formatCurrency;
window.getQueryParam = getQueryParam;

document.addEventListener('DOMContentLoaded', initApp);
