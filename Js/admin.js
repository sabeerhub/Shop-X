// ============================================================
// shop-X | Admin Module
// ============================================================
import {
  fetchDashboardStats, fetchProducts, fetchAllOrders, fetchAllUsers,
  createProduct, updateProduct, deleteProduct,
  uploadProductImage, updateOrderStatus, getImageUrl
} from './appwrite.js';
import { formatPrice, showToast, renderEmpty, CATEGORIES } from './ui.js';

// ── Dashboard ─────────────────────────────────────────────────
export async function renderDashboard() {
  try {
    const stats = await fetchDashboardStats();
    document.getElementById('stat-products').textContent = stats.totalProducts;
    document.getElementById('stat-users').textContent = stats.totalUsers;
    document.getElementById('stat-orders').textContent = stats.totalOrders;
    document.getElementById('stat-revenue').textContent = formatPrice(stats.totalRevenue);
  } catch (err) {
    console.error('Dashboard stats failed:', err);
  }
}

// ── Products Management ───────────────────────────────────────
export async function renderAdminProducts() {
  const table = document.getElementById('products-table-body');
  if (!table) return;
  table.innerHTML = '<tr><td colspan="7" class="table-loading">Loading...</td></tr>';
  try {
    const result = await fetchProducts({ limit: 100 });
    if (!result.documents.length) {
      table.innerHTML = '<tr><td colspan="7" class="table-empty">No products yet.</td></tr>';
      return;
    }
    table.innerHTML = result.documents.map(p => `
      <tr>
        <td><img src="${getImageUrl(p.image)}" alt="${p.title}" class="table-thumb"></td>
        <td><span class="table-title">${p.title}</span></td>
        <td>${p.category}</td>
        <td>${formatPrice(p.price)}</td>
        <td><span class="stock-badge ${p.stock > 0 ? 'in-stock' : 'out-stock'}">${p.stock}</span></td>
        <td>★ ${p.rating || 0}</td>
        <td class="table-actions">
          <a href="/admin/add-product.html?id=${p.$id}" class="btn-table btn-edit">Edit</a>
          <button class="btn-table btn-delete" data-id="${p.$id}">Delete</button>
        </td>
      </tr>`).join('');
    // Delete handlers
    table.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this product?')) return;
        try {
          await deleteProduct(btn.dataset.id);
          showToast('Product deleted');
          renderAdminProducts();
        } catch (err) {
          showToast('Failed to delete product', 'error');
        }
      });
    });
  } catch (err) {
    table.innerHTML = '<tr><td colspan="7">Failed to load products.</td></tr>';
  }
}

// ── Add / Edit Product Form ───────────────────────────────────
export async function setupProductForm() {
  const form = document.getElementById('product-form');
  if (!form) return;
  const params = new URLSearchParams(window.location.search);
  const editId = params.get('id');
  let existingProduct = null;

  // Render category options
  const catSelect = form.querySelector('[name="category"]');
  if (catSelect) {
    catSelect.innerHTML = CATEGORIES.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
  }

  if (editId) {
    document.querySelector('.form-page-title').textContent = 'Edit Product';
    const { fetchProduct } = await import('./appwrite.js');
    existingProduct = await fetchProduct(editId);
    // Fill form
    Object.entries(existingProduct).forEach(([key, val]) => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) input.value = val;
    });
    // Show existing image
    if (existingProduct.image) {
      const preview = document.getElementById('image-preview');
      if (preview) { preview.src = getImageUrl(existingProduct.image); preview.style.display = 'block'; }
    }
  }

  // Image preview
  const imageInput = form.querySelector('[name="imageFile"]');
  if (imageInput) {
    imageInput.addEventListener('change', () => {
      const file = imageInput.files[0];
      if (!file) return;
      const preview = document.getElementById('image-preview');
      if (preview) { preview.src = URL.createObjectURL(file); preview.style.display = 'block'; }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    try {
      const data = {
        title: form.querySelector('[name="title"]').value,
        description: form.querySelector('[name="description"]').value,
        price: parseFloat(form.querySelector('[name="price"]').value),
        originalPrice: parseFloat(form.querySelector('[name="originalPrice"]')?.value || 0) || null,
        category: form.querySelector('[name="category"]').value,
        stock: parseInt(form.querySelector('[name="stock"]').value),
        rating: parseFloat(form.querySelector('[name="rating"]')?.value || 0) || 0,
        reviewCount: parseInt(form.querySelector('[name="reviewCount"]')?.value || 0) || 0,
      };
      // Handle image upload
      const file = imageInput?.files[0];
      if (file) {
        const uploaded = await uploadProductImage(file);
        data.image = uploaded.$id;
      } else if (existingProduct?.image) {
        data.image = existingProduct.image;
      }
      if (editId) {
        await updateProduct(editId, data);
        showToast('Product updated!');
      } else {
        await createProduct(data);
        showToast('Product created!');
      }
      setTimeout(() => { window.location.href = '/admin/products.html'; }, 1000);
    } catch (err) {
      showToast(err.message || 'Failed to save product.', 'error');
      btn.disabled = false;
      btn.textContent = editId ? 'Update Product' : 'Add Product';
    }
  });
}

// ── Orders Management ─────────────────────────────────────────
export async function renderAdminOrders() {
  const table = document.getElementById('orders-table-body');
  if (!table) return;
  table.innerHTML = '<tr><td colspan="6" class="table-loading">Loading...</td></tr>';
  try {
    const result = await fetchAllOrders(100);
    if (!result.documents.length) {
      table.innerHTML = '<tr><td colspan="6" class="table-empty">No orders yet.</td></tr>';
      return;
    }
    table.innerHTML = result.documents.map(o => {
      let products = [];
      try { products = JSON.parse(o.products || '[]'); } catch {}
      return `
        <tr>
          <td><code>#${o.$id.slice(-8).toUpperCase()}</code></td>
          <td><span class="table-userid">${o.userId?.slice(-8)}</span></td>
          <td>${products.length} item(s)</td>
          <td>${formatPrice(o.totalPrice)}</td>
          <td>
            <select class="status-select" data-id="${o.$id}">
              ${['pending','processing','shipped','delivered','cancelled'].map(s =>
                `<option ${o.status === s ? 'selected' : ''} value="${s}">${s.charAt(0).toUpperCase()+s.slice(1)}</option>`
              ).join('')}
            </select>
          </td>
          <td>${new Date(o.createdAt || o.$createdAt).toLocaleDateString()}</td>
        </tr>`;
    }).join('');
    // Status change handlers
    table.querySelectorAll('.status-select').forEach(sel => {
      sel.addEventListener('change', async () => {
        try {
          await updateOrderStatus(sel.dataset.id, sel.value);
          showToast('Order status updated');
        } catch {
          showToast('Failed to update status', 'error');
        }
      });
    });
  } catch (err) {
    table.innerHTML = '<tr><td colspan="6">Failed to load orders.</td></tr>';
  }
}

// ── Users Management ──────────────────────────────────────────
export async function renderAdminUsers() {
  const table = document.getElementById('users-table-body');
  if (!table) return;
  table.innerHTML = '<tr><td colspan="5" class="table-loading">Loading...</td></tr>';
  try {
    const result = await fetchAllUsers(100);
    if (!result.documents.length) {
      table.innerHTML = '<tr><td colspan="5" class="table-empty">No users yet.</td></tr>';
      return;
    }
    table.innerHTML = result.documents.map(u => `
      <tr>
        <td><div class="user-avatar">${(u.name||'U').charAt(0).toUpperCase()}</div></td>
        <td>${u.name || '—'}</td>
        <td>${u.email || '—'}</td>
        <td><span class="role-badge role-${u.role}">${u.role}</span></td>
        <td>${new Date(u.$createdAt).toLocaleDateString()}</td>
      </tr>`).join('');
  } catch (err) {
    table.innerHTML = '<tr><td colspan="5">Failed to load users.</td></tr>';
  }
}
