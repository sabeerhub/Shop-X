// ============================================================
// shop-X | Auth Module
// ============================================================
import { getCurrentUser, loginUser, logoutUser, registerUser } from './appwrite.js';

export let currentUser = null;

export async function initAuth() {
  currentUser = await getCurrentUser();
  updateNavUI();
  return currentUser;
}

export function updateNavUI() {
  const authLinks = document.querySelectorAll('[data-auth-show]');
  const guestLinks = document.querySelectorAll('[data-guest-show]');
  const userNameEls = document.querySelectorAll('[data-user-name]');
  const adminLinks = document.querySelectorAll('[data-admin-show]');

  if (currentUser) {
    authLinks.forEach(el => el.style.display = '');
    guestLinks.forEach(el => el.style.display = 'none');
    userNameEls.forEach(el => el.textContent = currentUser.name || 'User');
    adminLinks.forEach(el => el.style.display = currentUser.role === 'admin' ? '' : 'none');
  } else {
    authLinks.forEach(el => el.style.display = 'none');
    guestLinks.forEach(el => el.style.display = '');
    adminLinks.forEach(el => el.style.display = 'none');
  }
}

export function requireAuth(redirect = '/login.html') {
  if (!currentUser) {
    window.location.href = redirect + '?redirect=' + encodeURIComponent(window.location.pathname);
    return false;
  }
  return true;
}

export function requireAdmin() {
  if (!currentUser || currentUser.role !== 'admin') {
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

// Handle login form
export function setupLoginForm(formId = 'login-form') {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.querySelector('[name="email"]').value;
    const password = form.querySelector('[name="password"]').value;
    const btn = form.querySelector('[type="submit"]');
    const error = form.querySelector('.form-error');
    btn.disabled = true;
    btn.textContent = 'Signing in...';
    try {
      await loginUser(email, password);
      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get('redirect') || '/index.html';
    } catch (err) {
      if (error) error.textContent = err.message || 'Invalid credentials. Please try again.';
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });
}

// Handle register form
export function setupRegisterForm(formId = 'register-form') {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.querySelector('[name="name"]').value;
    const email = form.querySelector('[name="email"]').value;
    const password = form.querySelector('[name="password"]').value;
    const confirm = form.querySelector('[name="confirm"]')?.value;
    const btn = form.querySelector('[type="submit"]');
    const error = form.querySelector('.form-error');
    if (confirm && password !== confirm) {
      if (error) error.textContent = 'Passwords do not match.';
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Creating account...';
    try {
      await registerUser(name, email, password);
      window.location.href = '/index.html';
    } catch (err) {
      if (error) error.textContent = err.message || 'Registration failed. Please try again.';
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });
}

// Handle logout
export function setupLogoutButtons() {
  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      await logoutUser();
      window.location.href = '/index.html';
    });
  });
}
