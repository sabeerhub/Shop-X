// ============================================================
// shop-X | Checkout Module
// ============================================================
import { createOrder, clearCart as clearCartDB } from './appwrite.js';
import { getCart, clearCartCache } from './cart.js';
import { showToast, formatPrice } from './ui.js';

export async function renderCheckoutPage(user) {
  const container = document.getElementById('checkout-form-wrap');
  const summaryEl = document.getElementById('order-summary');
  if (!container) return;

  if (!user) {
    window.location.href = '/login.html?redirect=/checkout.html';
    return;
  }

  const { items, total } = await getCart(user.$id);
  if (!items.length) {
    window.location.href = '/cart.html';
    return;
  }

  const shipping = total > 50 ? 0 : 5.99;
  const tax = total * 0.08;
  const grand = total + shipping + tax;

  // Order summary
  if (summaryEl) {
    summaryEl.innerHTML = `
      <h3>Order Summary</h3>
      <div class="checkout-items">
        ${items.map(item => `
          <div class="checkout-item">
            <span class="co-name">${item.product?.title} <span class="co-qty">×${item.quantity}</span></span>
            <span class="co-price">${formatPrice((item.product?.price || 0) * item.quantity)}</span>
          </div>`).join('')}
      </div>
      <div class="summary-row"><span>Subtotal</span><span>${formatPrice(total)}</span></div>
      <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? 'FREE' : formatPrice(shipping)}</span></div>
      <div class="summary-row"><span>Tax</span><span>${formatPrice(tax)}</span></div>
      <div class="summary-row total-row"><span>Total</span><span>${formatPrice(grand)}</span></div>
    `;
  }

  // Prefill address
  const addressInput = document.getElementById('address');
  if (addressInput && user.address) addressInput.value = user.address;

  // Form submit
  const form = document.getElementById('checkout-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Placing Order...';
    const address = {
      fullName: form.querySelector('[name="fullName"]').value,
      address: form.querySelector('[name="address"]').value,
      city: form.querySelector('[name="city"]').value,
      zip: form.querySelector('[name="zip"]').value,
      country: form.querySelector('[name="country"]').value,
    };
    try {
      const products = items.map(item => ({
        productId: item.productId,
        title: item.product?.title,
        price: item.product?.price,
        quantity: item.quantity,
        image: item.product?.image
      }));
      const order = await createOrder(user.$id, products, grand, JSON.stringify(address));
      await clearCartDB(user.$id);
      clearCartCache();
      showToast('Order placed successfully! 🎉');
      setTimeout(() => { window.location.href = '/orders.html?success=1'; }, 1200);
    } catch (err) {
      showToast(err.message || 'Failed to place order.', 'error');
      btn.disabled = false;
      btn.textContent = 'Place Order';
    }
  });
}
