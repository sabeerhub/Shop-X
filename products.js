// ============================================================
// shop-X | Products Module
// ============================================================
import { fetchProducts, fetchProduct, fetchFeaturedProducts, getImageUrl } from './appwrite.js';
import { renderSkeletons, renderEmpty, renderError, renderStars, formatPrice, truncate, lazyLoadImages, debounce, renderPagination, CATEGORIES } from './ui.js';

// ── Product Card ──────────────────────────────────────────────
export function productCard(product) {
  const img = getImageUrl(product.image);
  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
  return `
  <article class="product-card" data-id="${product.$id}">
    <a href="/product.html?id=${product.$id}" class="card-link">
      <div class="card-img-wrap">
        <img data-src="${img}" src="/assets/images/placeholder.svg" alt="${product.title}" class="card-img" loading="lazy">
        ${discount > 0 ? `<span class="badge badge-discount">-${discount}%</span>` : ''}
        ${product.stock === 0 ? `<span class="badge badge-sold">Sold Out</span>` : ''}
        <div class="card-overlay">
          <button class="btn-quick-view" data-id="${product.$id}">Quick View</button>
        </div>
      </div>
      <div class="card-body">
        <div class="card-category">${product.category || 'General'}</div>
        <h3 class="card-title">${truncate(product.title, 55)}</h3>
        <div class="card-stars">${renderStars(product.rating || 0)}<span class="rating-count">(${product.reviewCount || 0})</span></div>
        <div class="card-footer">
          <div class="price-wrap">
            <span class="price-current">${formatPrice(product.price)}</span>
            ${product.originalPrice ? `<span class="price-original">${formatPrice(product.originalPrice)}</span>` : ''}
          </div>
          <button class="btn-add-cart" data-id="${product.$id}" data-stock="${product.stock}" title="Add to cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          </button>
        </div>
      </div>
    </a>
  </article>`;
}

// ── Render Grid ───────────────────────────────────────────────
export async function renderProductGrid(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  renderSkeletons(container, options.skeletons || 8);
  try {
    const result = await fetchProducts(options);
    if (!result.documents.length) {
      renderEmpty(container, 'No products found. Try different filters.', '🔍');
      return result;
    }
    container.innerHTML = result.documents.map(productCard).join('');
    lazyLoadImages();
    setupCardEvents(container, options.onAddToCart);
    return result;
  } catch (err) {
    renderError(container, 'Failed to load products.');
    console.error(err);
  }
}

export function setupCardEvents(container, onAddToCart) {
  container.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.id;
      const stock = parseInt(btn.dataset.stock);
      if (stock === 0) return;
      if (onAddToCart) await onAddToCart(id, btn);
    });
  });
  container.querySelectorAll('.btn-quick-view').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.id;
      await showQuickView(id);
    });
  });
}

// ── Quick View Modal ──────────────────────────────────────────
export async function showQuickView(productId) {
  let modal = document.getElementById('quick-view-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'quick-view-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `<div class="modal-box"><button class="modal-close" id="close-quick-view">✕</button><div class="modal-content" id="quick-view-content"></div></div>`;
    document.body.appendChild(modal);
    document.getElementById('close-quick-view').addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
  }
  const content = document.getElementById('quick-view-content');
  content.innerHTML = '<div class="loading-spinner"></div>';
  modal.classList.add('open');
  try {
    const p = await fetchProduct(productId);
    const img = getImageUrl(p.image);
    content.innerHTML = `
      <div class="quick-view-grid">
        <div class="qv-img-wrap"><img src="${img}" alt="${p.title}" class="qv-img"></div>
        <div class="qv-details">
          <span class="qv-cat">${p.category}</span>
          <h2 class="qv-title">${p.title}</h2>
          <div class="qv-stars">${renderStars(p.rating || 0)}</div>
          <div class="qv-price">${formatPrice(p.price)}</div>
          <p class="qv-desc">${p.description || ''}</p>
          <div class="qv-stock ${p.stock > 0 ? 'in-stock' : 'out-stock'}">${p.stock > 0 ? `✓ In Stock (${p.stock})` : '✕ Out of Stock'}</div>
          <div class="qv-actions">
            <a href="/product.html?id=${p.$id}" class="btn btn-outline">View Details</a>
            <button class="btn btn-primary btn-add-cart-qv" data-id="${p.$id}" ${p.stock === 0 ? 'disabled' : ''}>Add to Cart</button>
          </div>
        </div>
      </div>`;
  } catch {
    content.innerHTML = '<p>Failed to load product.</p>';
  }
}

// ── Category Filters ──────────────────────────────────────────
export function renderCategoryFilters(containerId, activeCategory, onChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <button class="filter-chip ${!activeCategory ? 'active' : ''}" data-cat="">All</button>
    ${CATEGORIES.map(c => `<button class="filter-chip ${activeCategory === c.id ? 'active' : ''}" data-cat="${c.id}">${c.icon} ${c.label}</button>`).join('')}
  `;
  container.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(btn.dataset.cat);
    });
  });
}

// ── Search Bar ────────────────────────────────────────────────
export function setupSearchBar(inputId, onSearch) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const debouncedSearch = debounce(onSearch, 400);
  input.addEventListener('input', () => debouncedSearch(input.value.trim()));
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') onSearch(input.value.trim()); });
}
