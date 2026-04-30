const totalSalesEl = document.getElementById('totalSales');
const orderCountEl = document.getElementById('orderCount');
const customerCountEl = document.getElementById('customerCount');
const topProductsEl = document.getElementById('topProducts');
const couponListEl = document.getElementById('couponList');
const couponForm = document.getElementById('couponForm');
const couponCodeInput = document.getElementById('couponCode');
const couponDiscountInput = document.getElementById('couponDiscount');
const couponMinTotalInput = document.getElementById('couponMinTotal');
const couponExpiresInput = document.getElementById('couponExpires');
const couponActiveInput = document.getElementById('couponActive');
const couponAdminMessage = document.getElementById('couponAdminMessage');
const resetCouponButton = document.getElementById('resetCoupon');
const deleteCouponButton = document.getElementById('deleteCouponButton');

const productForm = document.getElementById('productForm');
const productNameInput = document.getElementById('productName');
const productPriceInput = document.getElementById('productPrice');
const productCategoryInput = document.getElementById('productCategory');
const productRatingInput = document.getElementById('productRating');
const productStockInput = document.getElementById('productStock');
const productImageInput = document.getElementById('productImage');
const productDescriptionInput = document.getElementById('productDescription');
const resetProductButton = document.getElementById('resetProduct');
const productAdminMessage = document.getElementById('productAdminMessage');
const productListEl = document.getElementById('productList');

let editingCouponId = null;
let editingProductId = null;

const loadAdminDashboard = async () => {
  try {
    const response = await fetch(`${apiBase}/admin/dashboard`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.message || 'Unable to load admin data');
      return;
    }
    totalSalesEl.textContent = formatCurrency(Number(data.totalSales || 0));
    orderCountEl.textContent = data.ordersCount || 0;
    customerCountEl.textContent = data.customers || 0;
    topProductsEl.innerHTML = data.topProducts.map((product) => buildProductCard(product, false)).join('');
  } catch (error) {
    console.error(error);
    showToast('Admin dashboard load failed');
  }
};

const loadCoupons = async () => {
  if (!couponListEl) return;
  try {
    const response = await fetch(`${apiBase}/coupons/admin`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.message || 'Unable to load coupons');
      return;
    }
    couponListEl.innerHTML = data.map((coupon) => `
      <tr class="coupon-row ${coupon.active ? '' : 'coupon-inactive'}">
        <td>${coupon.code}</td>
        <td>${coupon.discount_percent}%</td>
        <td>${formatCurrency(Number(coupon.min_total))}</td>
        <td>${coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'None'}</td>
        <td>${coupon.active ? 'Active' : 'Inactive'}</td>
        <td class="coupon-actions">
          <button class="button button--secondary" type="button" onclick="editCoupon(${coupon.id})">Edit</button>
          <button class="button button--ghost" type="button" onclick="removeCoupon(${coupon.id})">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error(error);
    showToast('Unable to load coupons');
  }
};

const loadAdminProducts = async () => {
  if (!productListEl) return;
  try {
    const response = await fetch(`${apiBase}/products`, { headers: getAuthHeaders() });
    const products = await response.json();
    if (!response.ok) {
      showToast(products.message || 'Unable to load products');
      return;
    }
    productListEl.innerHTML = products.length ? products.map((product) => `
      <tr>
        <td>${product.name}</td>
        <td>${product.category}</td>
        <td>${formatCurrency(product.price)}</td>
        <td>${product.stock}</td>
        <td class="table-actions">
          <button class="button button--secondary" type="button" onclick="editProduct(${product.id})">Edit</button>
          <button class="button button--ghost" type="button" onclick="removeProduct(${product.id})">Delete</button>
        </td>
      </tr>
    `).join('') : '<tr><td colspan="5">No products available.</td></tr>';
  } catch (error) {
    console.error(error);
    showToast('Unable to load products');
  }
};

const resetCouponForm = () => {
  editingCouponId = null;
  if (!couponForm) return;
  couponForm.reset();
  couponActiveInput.checked = true;
  couponAdminMessage.textContent = '';
  deleteCouponButton.style.display = 'none';
};

const resetProductForm = () => {
  if (!productForm) return;
  editingProductId = null;
  productForm.reset();
  productAdminMessage.textContent = '';
};

const populateProductForm = (product) => {
  editingProductId = product.id;
  productNameInput.value = product.name;
  productPriceInput.value = product.price;
  productCategoryInput.value = product.category;
  productRatingInput.value = product.rating;
  productStockInput.value = product.stock;
  productImageInput.value = product.image;
  productDescriptionInput.value = product.description;
  productAdminMessage.textContent = 'Editing product. Save changes or reset form.';
};

window.editProduct = async (id) => {
  try {
    const response = await fetch(`${apiBase}/products/${id}`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.message || 'Unable to load product');
      return;
    }
    populateProductForm(data.product);
  } catch (error) {
    console.error(error);
    showToast('Unable to load product');
  }
};

window.removeProduct = async (id) => {
  if (!window.confirm('Delete this product permanently?')) return;
  try {
    const response = await fetch(`${apiBase}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.message || 'Unable to delete product');
      return;
    }
    showToast(data.message || 'Product deleted');
    loadAdminProducts();
    loadAdminDashboard();
    if (editingProductId === id) resetProductForm();
  } catch (error) {
    console.error(error);
    showToast('Unable to delete product');
  }
};

const handleProductSubmit = async (event) => {
  event.preventDefault();
  if (!productForm) return;
  const payload = {
    name: productNameInput.value.trim(),
    price: Number(productPriceInput.value),
    category: productCategoryInput.value,
    rating: Number(productRatingInput.value),
    stock: Number(productStockInput.value),
    image: productImageInput.value.trim(),
    description: productDescriptionInput.value.trim(),
  };
  try {
    const url = editingProductId ? `${apiBase}/products/${editingProductId}` : `${apiBase}/products`;
    const method = editingProductId ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.message || 'Unable to save product');
      productAdminMessage.textContent = data.message || 'Unable to save product';
      return;
    }
    showToast(editingProductId ? 'Product updated successfully' : 'Product added successfully');
    resetProductForm();
    loadAdminProducts();
    loadAdminDashboard();
  } catch (error) {
    console.error(error);
    showToast('Unable to create product');
  }
};

const populateCouponForm = (coupon) => {
  editingCouponId = coupon.id;
  couponCodeInput.value = coupon.code;
  couponDiscountInput.value = coupon.discount_percent;
  couponMinTotalInput.value = coupon.min_total;
  couponExpiresInput.value = coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 10) : '';
  couponActiveInput.checked = coupon.active;
  couponAdminMessage.textContent = 'Editing coupon. Save changes or reset form.';
  deleteCouponButton.style.display = 'inline-flex';
};

window.editCoupon = async (id) => {
  try {
    const response = await fetch(`${apiBase}/coupons/admin`, { headers: getAuthHeaders() });
    const data = await response.json();
    const coupon = data.find((item) => item.id === id);
    if (!coupon) {
      showToast('Coupon not found.');
      return;
    }
    populateCouponForm(coupon);
  } catch (error) {
    console.error(error);
    showToast('Unable to open coupon for editing');
  }
};

window.removeCoupon = async (id) => {
  if (!window.confirm('Delete this coupon permanently?')) return;
  try {
    const response = await fetch(`${apiBase}/coupons/admin/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.message || 'Unable to delete coupon');
      return;
    }
    showToast(data.message || 'Coupon deleted');
    resetCouponForm();
    loadCoupons();
  } catch (error) {
    console.error(error);
    showToast('Delete request failed');
  }
};

const handleCouponSubmit = async (event) => {
  event.preventDefault();
  if (!couponForm) return;
  const payload = {
    code: couponCodeInput.value.trim(),
    discount_percent: Number(couponDiscountInput.value),
    min_total: Number(couponMinTotalInput.value),
    expires_at: couponExpiresInput.value || null,
    active: couponActiveInput.checked,
  };
  try {
    const method = editingCouponId ? 'PUT' : 'POST';
    const url = editingCouponId ? `${apiBase}/coupons/admin/${editingCouponId}` : `${apiBase}/coupons/admin`;
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.message || 'Unable to save coupon');
      couponAdminMessage.textContent = data.message || 'Unable to save coupon';
      return;
    }
    showToast(editingCouponId ? 'Coupon updated' : 'Coupon created');
    resetCouponForm();
    loadCoupons();
  } catch (error) {
    console.error(error);
    showToast('Unable to save coupon');
  }
};

const initAdminCouponControls = () => {
  if (couponForm) couponForm.addEventListener('submit', handleCouponSubmit);
  if (resetCouponButton) resetCouponButton.addEventListener('click', resetCouponForm);
  if (deleteCouponButton) deleteCouponButton.addEventListener('click', () => {
    if (editingCouponId) removeCoupon(editingCouponId);
  });
  resetCouponForm();
  loadCoupons();
};

const initAdminProductControls = () => {
  if (productForm) productForm.addEventListener('submit', handleProductSubmit);
  if (resetProductButton) resetProductButton.addEventListener('click', resetProductForm);
  resetProductForm();
  loadAdminProducts();
};

document.addEventListener('DOMContentLoaded', () => {
  loadAdminDashboard();
  initAdminCouponControls();
  initAdminProductControls();
});
