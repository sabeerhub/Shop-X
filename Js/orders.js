// ============================================================
// shop-X | Orders Module
// ============================================================
import { fetchUserOrders } from './appwrite.js';
import { formatPrice, renderEmpty } from './ui.js';

export async function renderOrdersPage(userId) {
  const container = document.getElementById('orders-list');
  if (!container) return;
  container.innerHTML = '<div class="loading-spinner"></div>';
  if (!userId) {
    container.innerHTML = `<div class="empty-state"><p>Please <a href="/login.html">login</a> to view orders.</p></div>`;
    return;
  }
  try {
    const result = await fetchUserOrders(userId);
    if (!result.documents.length) {
      renderEmpty(container, 'No orders yet. Start shopping!', '📦');
      return;
    }
    // Success banner
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      const banner = document.createElement('div');
      banner.className = 'success-banner';
      banner.innerHTML = '🎉 Your order has been placed successfully!';
      container.parentNode.insertBefore(banner, container);
    }
    container.innerHTML = result.documents.map(order => renderOrderCard(order)).join('');
  } catch (err) {
    container.innerHTML = '<div class="error-state"><p>Failed to load orders.</p></div>';
  }
}

function renderOrderCard(order) {
  let products = [];
  try { products = JSON.parse(order.products || '[]'); } catch {}
  const statusClass = {
    pending: 'status-pending',
    processing: 'status-processing',
    shipped: 'status-shipped',
    delivered: 'status-delivered',
    cancelled: 'status-cancelled'
  }[order.status] || 'status-pending';

  return `
  <div class="order-card">
    <div class="order-header">
      <div>
        <span class="order-id">Order #${order.$id.slice(-8).toUpperCase()}</span>
        <span class="order-date">${new Date(order.createdAt || order.$createdAt).toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'})}</span>
      </div>
      <span class="order-status ${statusClass}">${order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}</span>
    </div>
    <div class="order-products">
      ${products.slice(0, 3).map(p => `
        <div class="order-product-row">
          <span class="op-title">${p.title}</span>
          <span class="op-qty">×${p.quantity}</span>
          <span class="op-price">${formatPrice(p.price * p.quantity)}</span>
        </div>`).join('')}
      ${products.length > 3 ? `<div class="op-more">+${products.length - 3} more items</div>` : ''}
    </div>
    <div class="order-footer">
      <span class="order-total">Total: <strong>${formatPrice(order.totalPrice)}</strong></span>
    </div>
  </div>`;
}
