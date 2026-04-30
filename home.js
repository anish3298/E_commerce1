const featuredSection = document.getElementById('featuredProducts');
const recommendedSection = document.getElementById('recommendedProducts');

const loadHomepageProducts = async () => {
  if (!featuredSection || !recommendedSection) return;
  try {
    const response = await fetch(`${apiBase}/products`);
    const products = await response.json();
    const featured = products.slice(0, 4);
    const recommended = products.slice(1, 5);
    featuredSection.innerHTML = featured.map(buildProductCard).join('');
    recommendedSection.innerHTML = recommended.map(buildProductCard).join('');
  } catch (error) {
    console.error(error);
  }
};

document.addEventListener('DOMContentLoaded', loadHomepageProducts);
