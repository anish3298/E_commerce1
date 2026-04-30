const wishlistGrid = document.getElementById('wishlistGrid');
const wishlistEmpty = document.getElementById('wishlistEmpty');

const renderWishlist = (products) => {
  if (!wishlistGrid) return;
  if (!products.length) {
    wishlistGrid.innerHTML = '';
    wishlistEmpty.hidden = false;
    return;
  }
  wishlistEmpty.hidden = true;
  wishlistGrid.innerHTML = products.map((product) => `
    <article class="product-card">
      <img src="${product.image}" alt="${product.name}" />
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.category}</p>
        <div class="product-meta">
          <span>${formatCurrency(product.price)}</span>
          <span>⭐ ${product.rating}</span>
        </div>
        <div class="card-actions">
          <button class="button button--secondary" onclick="location.href='product.html?id=${product.id}'">View</button>
          <button class="button button--primary" onclick="addToCart(${product.id})">Add to cart</button>
        </div>
        <button class="button button--ghost" onclick="removeFromWishlist(${product.id})">Remove from wishlist</button>
      </div>
    </article>
  `).join('');
};

const loadWishlist = async () => {
  if (!wishlistGrid) return;
  try {
    const response = await fetch(`${apiBase}/wishlist`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.message || 'Unable to load wishlist');
      return;
    }
    renderWishlist(data);
  } catch (error) {
    console.error(error);
    showToast('Unable to load wishlist');
  }
};

window.removeFromWishlist = async (productId) => {
  try {
    const response = await fetch(`${apiBase}/wishlist/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.message || 'Unable to remove from wishlist');
      return;
    }
    showToast('Removed from wishlist');
    loadWishlist();
  } catch (error) {
    console.error(error);
    showToast('Unable to remove from wishlist');
  }
};

document.addEventListener('DOMContentLoaded', loadWishlist);
