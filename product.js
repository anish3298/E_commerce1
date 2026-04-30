const productDetailContainer = document.getElementById('productDetail');
const relatedProductsContainer = document.getElementById('relatedProducts');

const submitReview = async (productId, event) => {
  event.preventDefault();
  const form = event.target;
  const rating = form.querySelector('[name="rating"]').value;
  const comment = form.querySelector('[name="comment"]').value;
  try {
    const response = await fetch(`${apiBase}/products/${productId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ rating, comment }),
    });
    const result = await response.json();
    if (!response.ok) {
      showToast(result.message || 'Review submission failed');
      return;
    }
    showToast('Review submitted');
    loadProductDetails();
  } catch (error) {
    console.error(error);
    showToast('Unable to submit review');
  }
};

const renderReviewForm = (productId) => {
  const reviewContainer = document.getElementById('reviewFormContainer');
  if (!reviewContainer) return;
  const user = getUser();
  if (!user) {
    reviewContainer.innerHTML = `
      <div class="review-prompt">
        <p>Please <a href="#authModal" onclick="openAuthModal()">login</a> to leave a review.</p>
      </div>
    `;
    return;
  }
  reviewContainer.innerHTML = `
    <div class="review-form">
      <h3>Leave a review</h3>
      <form id="reviewForm">
        <label>Rating</label>
        <select name="rating" required>
          <option value="5">5 - Excellent</option>
          <option value="4">4 - Very good</option>
          <option value="3">3 - Good</option>
          <option value="2">2 - Fair</option>
          <option value="1">1 - Poor</option>
        </select>
        <label>Comment</label>
        <textarea name="comment" rows="4" placeholder="Share your experience"></textarea>
        <button type="submit" class="button button--primary">Submit review</button>
      </form>
    </div>
  `;
  const reviewForm = document.getElementById('reviewForm');
  reviewForm?.addEventListener('submit', (event) => submitReview(productId, event));
};

const loadProductDetails = async () => {
  const id = getQueryParam('id');
  if (!id || !productDetailContainer) return;
  try {
    const response = await fetch(`${apiBase}/products/${id}`);
    const data = await response.json();
    if (!data.product) {
      productDetailContainer.innerHTML = '<p>Product not found.</p>';
      return;
    }
    const product = data.product;
    productDetailContainer.innerHTML = `
      <div class="product-gallery">
        <img src="${product.image}" alt="${product.name}" />
      </div>
      <div class="product-detail-card">
        <span class="eyebrow">${product.category}</span>
        <h2>${product.name}</h2>
        <div class="rating-pill">⭐ ${product.rating}</div>
        <div class="price-tag">${formatCurrency(product.price)}</div>
        <p>${product.description}</p>
        <div class="card-actions">
          <button class="button button--primary" onclick="addToCart(${product.id})">Add to cart</button>
          <button class="button button--secondary" onclick="location.href='checkout.html'">Buy now</button>
          <button class="button button--ghost" onclick="addToWishlist(${product.id})">Add to wishlist</button>
        </div>
        <div class="summary-card">
          <div class="summary-row"><span>Delivery</span><strong>3–5 days</strong></div>
          <div class="summary-row"><span>Seller</span><strong>Anish Premium</strong></div>
        </div>
      </div>
      <aside class="product-summary-card">
        <h3>Customer reviews</h3>
        ${data.product.Reviews && data.product.Reviews.length ? data.product.Reviews.map((review) => `
          <div class="review-card">
            <div class="review-stars">${'⭐'.repeat(review.rating)} ${review.rating}</div>
            <div class="review-meta">${review.User ? review.User.name : 'Anonymous'}</div>
            <p>${review.comment || 'Loved it!'}</p>
          </div>
        `).join('') : '<p>No reviews yet.</p>'}
      </aside>
      <aside class="product-summary-card" id="reviewFormContainer"></aside>
    `;
    renderReviewForm(product.id);
    relatedProductsContainer.innerHTML = data.related.map(buildProductCard).join('');
  } catch (error) {
    console.error(error);
    productDetailContainer.innerHTML = '<p>Unable to load product details.</p>';
  }
};

document.addEventListener('DOMContentLoaded', loadProductDetails);
