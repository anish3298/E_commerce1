const productGrid = document.getElementById('productGrid');
const panelCategory = document.getElementById('panelCategory');
const categoryFilterTopNav = document.getElementById('categoryFilter');
const minPriceInput = document.getElementById('minPrice');
const maxPriceInput = document.getElementById('maxPrice');
const minRatingSelect = document.getElementById('minRating');
const sortOrderSelect = document.getElementById('sortOrder');
const applyFiltersBtn = document.getElementById('applyFilters');

const buildProductsQuery = () => {
  const params = new URLSearchParams();
  const category = panelCategory?.value || getQueryParam('category');
  const minPrice = minPriceInput?.value;
  const maxPrice = maxPriceInput?.value;
  const rating = minRatingSelect?.value;
  const sort = sortOrderSelect?.value;
  if (category) params.set('category', category);
  if (minPrice) params.set('minPrice', minPrice);
  if (maxPrice) params.set('maxPrice', maxPrice);
  if (rating) params.set('rating', rating);
  if (sort) params.set('sort', sort);
  return params;
};

const loadProducts = async () => {
  if (!productGrid) return;
  const query = buildProductsQuery();
  try {
    const response = await fetch(`${apiBase}/products?${query.toString()}`);
    const products = await response.json();
    productGrid.innerHTML = products.length
      ? products.map(buildProductCard).join('')
      : '<p>No matching products found.</p>';
  } catch (error) {
    console.error(error);
    productGrid.innerHTML = '<p>Unable to load products.</p>';
  }
};

const restoreFilters = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get('category');
  const rating = urlParams.get('rating');
  const sort = urlParams.get('sort');
  const minPrice = urlParams.get('minPrice');
  const maxPrice = urlParams.get('maxPrice');

  if (category) {
    panelCategory.value = category;
    if (categoryFilterTopNav) categoryFilterTopNav.value = category;
  }
  if (rating && minRatingSelect) minRatingSelect.value = rating;
  if (sort && sortOrderSelect) sortOrderSelect.value = sort;
  if (minPrice && minPriceInput) minPriceInput.value = minPrice;
  if (maxPrice && maxPriceInput) maxPriceInput.value = maxPrice;
};

applyFiltersBtn?.addEventListener('click', (event) => {
  event.preventDefault();
  loadProducts();
});

window.addEventListener('DOMContentLoaded', () => {
  restoreFilters();
  loadProducts();
});
