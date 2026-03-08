// ============================================================
// shop-X | Cart Module
// ============================================================
import { fetchCart, addToCart, updateCartItem, removeFromCart, clearCart, fetchProduct, getImageUrl } from './appwrite.js';
import { showToast, formatPrice, updateCartBadge } from './ui.js';

let cartCache = null;

export async function getCart(userId) {
  if (!userId) return { items: [], total: 0 };
  if (cartCache) return cartCache;
  const result = await fetchCart(userId);
  // Enrich with product data
  const items = await Promise.all(result.documents.map(async item => {
    try {
      const product = await fetchProduct(item.productId);
      return { ...item, product };
    } catch {
      return { ...item, product: null };
    }
  }));
  const total = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  cartCache = { items: items.filter(i => i.product), total, count: items.length };
  updateCartBadge(cartCache.count);
  return cartCache;
}

export function clearCartCache() { cartCache = null; }

export async function handleAddToCart(productId, userId, btn) {
  if (!userId) {
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return;
  }
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-sm"></span>'; }
  try {
    await addToCart(userId, productId, 1);
    clearCartCache();
    const cart = await getCart(userId);
    updateCartBadge(cart.count);
    showToast('Added to cart! 🛒');
  } catch (err) {
    showToast(err.message || 'Failed to add to cart', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`;
    }
  }
}

export async function renderCartPage(userId) {
  const container = document.getElementById('cart-items');
  const summaryEl = document.getElementById('cart-summary');
  if (!container) return;

  container.innerHTML = '<div class="loading-spinner"></div>';

  if (!userId) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🛒</div><p>Please <a href="/login.html">login</a> to view your cart.</p></div>`;
    return;
  }

  try {
    const { items, total } = await getCart(userId);
    if (!items.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">🛒</div><p>Your cart is empty.</p><a href="/products.html" class="btn btn-primary">Start Shopping</a></div>`;
      if (summaryEl) summaryEl.style.display = 'none';
      return;
    }

    container.innerHTML = items.map(item => renderCartItem(item)).join('');
    if (summaryEl) renderCartSummary(summaryEl, items, total);

    // Events
    container.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const itemId = btn.dataset.id;
        const delta = parseInt(btn.dataset.delta);
        const item = items.find(i => i.$id === itemId);
        if (!item) return;
        const newQty = item.quantity + delta;
        if (newQty <= 0) {
          await removeFromCart(itemId);
        } else {
          await updateCartItem(itemId, newQty);
        }
        clearCartCache();
        await renderCartPage(userId);
      });
    });

    container.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        await removeFromCart(btn.dataset.id);
        clearCartCache();
        showToast('Item removed', 'info');
        await renderCartPage(userId);
      });
    });

  } catch (err) {
    container.innerHTML = '<div class="error-state"><p>Failed to load cart.</p></div>';
    console.error(err);
  }
}

function renderCartItem(item) {
  const img = getImageUrl(item.product?.image);
  return `
  <div class="cart-item" data-id="${item.$id}">
    <a href="/product.html?id=${item.productId}">
      <img src="${img}" alt="${item.product?.title}" class="cart-item-img">
    </a>
    <div class="cart-item-info">
      <a href="/product.html?id=${item.productId}" class="cart-item-title">${item.product?.title}</a>
      <div class="cart-item-cat">${item.product?.category || ''}</div>
      <div class="cart-item-price">${formatPrice(item.product?.price || 0)}</div>
    </div>
    <div class="cart-item-controls">
      <div class="qty-control">
        <button class="qty-btn" data-id="${item.$id}" data-delta="-1">−</button>
        <span class="qty-value">${item.quantity}</span>
        <button class="qty-btn" data-id="${item.$id}" data-delta="1">+</button>
      </div>
      <div class="cart-item-subtotal">${formatPrice((item.product?.price || 0) * item.quantity)}</div>
      <button class="btn-remove" data-id="${item.$id}" title="Remove">✕</button>
    </div>
  </div>`;
}

function renderCartSummary(el, items, total) {
  const shipping = total > 50 ? 0 : 5.99;
  const tax = total * 0.08;
  const grand = total + shipping + tax;
  el.style.display = '';
  el.innerHTML = `
    <div class="summary-card">
      <h3 class="summary-title">Order Summary</h3>
      <div class="summary-row"><span>Subtotal (${items.length} items)</span><span>${formatPrice(total)}</span></div>
      <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? '<span class="free-badge">FREE</span>' : formatPrice(shipping)}</span></div>
      <div class="summary-row"><span>Tax (8%)</span><span>${formatPrice(tax)}</span></div>
      <div class="summary-row total-row"><span>Total</span><span>${formatPrice(grand)}</span></div>
      <a href="/checkout.html" class="btn btn-primary btn-block">Proceed to Checkout</a>
      <a href="/products.html" class="btn btn-outline btn-block" style="margin-top:8px">Continue Shopping</a>
      ${total < 50 ? `<p class="free-shipping-note">Add ${formatPrice(50 - total)} more for FREE shipping!</p>` : '<p class="free-shipping-note green">✓ You qualify for free shipping!</p>'}
    </div>`;
}
