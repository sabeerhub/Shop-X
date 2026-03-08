// ============================================================
// shop-X | UI Utilities
// ============================================================

export function showToast(message, type = 'success', duration = 3500) {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${message}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-show'));
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

function createToastContainer() {
  const el = document.createElement('div');
  el.id = 'toast-container';
  document.body.appendChild(el);
  return el;
}

export function skeletonCard() {
  return `<div class="product-card skeleton-card">
    <div class="skeleton skeleton-img"></div>
    <div class="skeleton-body">
      <div class="skeleton skeleton-line w-80"></div>
      <div class="skeleton skeleton-line w-50"></div>
      <div class="skeleton skeleton-line w-60"></div>
    </div>
  </div>`;
}

export function renderSkeletons(container, count = 8) {
  container.innerHTML = Array(count).fill(skeletonCard()).join('');
}

export function renderEmpty(container, message = 'Nothing here yet.', icon = '📦') {
  container.innerHTML = `<div class="empty-state"><div class="empty-icon">${icon}</div><p>${message}</p></div>`;
}

export function renderError(container, message = 'Something went wrong.') {
  container.innerHTML = `<div class="error-state"><div class="error-icon">⚠️</div><p>${message}</p><button class="btn btn-primary" onclick="location.reload()">Retry</button></div>`;
}

export function renderStars(rating = 0) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let stars = '';
  for (let i = 0; i < 5; i++) {
    if (i < full) stars += '<span class="star star-full">★</span>';
    else if (i === full && half) stars += '<span class="star star-half">★</span>';
    else stars += '<span class="star star-empty">★</span>';
  }
  return `<div class="stars" title="${rating}/5">${stars}</div>`;
}

export function formatPrice(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price || 0);
}

export function truncate(str, len = 60) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

export function lazyLoadImages() {
  const imgs = document.querySelectorAll('img[data-src]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });
  imgs.forEach(img => observer.observe(img));
}

export function setupMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('mobile-nav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    toggle.classList.toggle('active');
    document.body.classList.toggle('menu-open');
  });
  // Close on link click
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.classList.remove('active');
    document.body.classList.remove('menu-open');
  }));
}

export function updateCartBadge(count) {
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = count > 99 ? '99+' : count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

export function setupStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 80) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
    lastY = y;
  }, { passive: true });
}

export function renderPagination(container, currentPage, totalPages, onPageChange) {
  if (totalPages <= 1) { container.innerHTML = ''; return; }
  let html = '<div class="pagination">';
  if (currentPage > 1) html += `<button class="page-btn" data-page="${currentPage - 1}">‹ Prev</button>`;
  for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  if (currentPage < totalPages) html += `<button class="page-btn" data-page="${currentPage + 1}">Next ›</button>`;
  html += '</div>';
  container.innerHTML = html;
  container.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => onPageChange(parseInt(btn.dataset.page)));
  });
}

export function getCategoryIcon(cat) {
  const icons = {
    electronics: '💻', fashion: '👗', home: '🏠', beauty: '💄',
    sports: '⚽', toys: '🧸', food: '🍕', books: '📚',
    automotive: '🚗', garden: '🌱', health: '💊', jewelry: '💍'
  };
  return icons[cat?.toLowerCase()] || '🛍️';
}

export const CATEGORIES = [
  { id: 'electronics', label: 'Electronics', icon: '💻' },
  { id: 'fashion', label: 'Fashion', icon: '👗' },
  { id: 'home', label: 'Home & Living', icon: '🏠' },
  { id: 'beauty', label: 'Beauty', icon: '💄' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'toys', label: 'Toys', icon: '🧸' },
  { id: 'books', label: 'Books', icon: '📚' },
  { id: 'health', label: 'Health', icon: '💊' },
];
