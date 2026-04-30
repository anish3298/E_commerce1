const orderHistoryList = document.getElementById('orderHistoryList');
const statusSteps = ['Ordered', 'Packed', 'Shipped', 'Delivered'];

const getStepHTML = (status) => {
  return statusSteps.map((step) => {
    const active = statusSteps.indexOf(step) <= statusSteps.indexOf(status);
    return `<span class="timeline-step${active ? ' active' : ''}">${step}</span>`;
  }).join('');
};

const loadOrderHistory = async () => {
  if (!orderHistoryList) return;
  try {
    const response = await fetch(`${apiBase}/orders/user`, { headers: getAuthHeaders() });
    const result = await response.json();
    if (!response.ok) {
      showToast(result.message || 'Unable to load orders');
      orderHistoryList.innerHTML = '<p>Please login to see your orders.</p>';
      return;
    }
    if (!result.length) {
      orderHistoryList.innerHTML = '<p>No orders found yet. Start shopping now!</p>';
      return;
    }
    orderHistoryList.innerHTML = result.map((order) => `
      <article class="order-card">
        <div class="order-card-header">
          <div>
            <h3>Order #${order.id}</h3>
            <span>${new Date(order.created_at).toLocaleDateString()}</span>
            <p class="muted">${order.payment_method} • ${order.payment_status}</p>
          </div>
          <div>
            <strong>${formatCurrency(order.total_price)}</strong>
          </div>
        </div>
        <div class="order-status">${getStepHTML(order.status)}</div>
        <div class="order-items-list">
          ${order.OrderItems.map((item) => `
            <div class="order-item-row">
              <span>${item.quantity} × ${item.Product.name}</span>
              <strong>${formatCurrency(item.price * item.quantity)}</strong>
            </div>
          `).join('')}
        </div>
        <div class="order-actions">
          <a class="button button--secondary" href="${apiBase}/orders/${order.id}/invoice">Download Invoice</a>
        </div>
      </article>
    `).join('');
  } catch (error) {
    console.error(error);
    orderHistoryList.innerHTML = '<p>Unable to load order history.</p>';
  }
};

document.addEventListener('DOMContentLoaded', loadOrderHistory);
