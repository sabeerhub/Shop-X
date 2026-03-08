// ============================================================
// shop-X | Appwrite Configuration & API Module
// ============================================================

const APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '69ad7512002b8c120c56'; // Replace with your Appwrite Project ID
const DATABASE_ID = 'shopx-db';

// Collection IDs
const COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products',
  CART: 'cart',
  ORDERS: 'orders',
};

const STORAGE_BUCKET_ID = 'product-images';

// ── Appwrite SDK Loader ───────────────────────────────────────
let sdk = null;
let client = null;
let account = null;
let databases = null;
let storage = null;

async function initAppwrite() {
  if (sdk) return;
  // Load Appwrite SDK from CDN
  await loadScript('https://cdn.jsdelivr.net/npm/appwrite@13.0.1');
  sdk = Appwrite;
  client = new sdk.Client();
  client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
  account = new sdk.Account(client);
  databases = new sdk.Databases(client);
  storage = new sdk.Storage(client);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function getSDK() {
  await initAppwrite();
  return { client, account, databases, storage, sdk };
}

// ── AUTH ─────────────────────────────────────────────────────
export async function registerUser(name, email, password) {
  const { account, sdk, databases } = await getSDK();
  const userId = sdk.ID.unique();
  const user = await account.create(userId, email, password, name);
  // Create user document in DB
  await databases.createDocument(DATABASE_ID, COLLECTIONS.USERS, userId, {
    name, email, role: 'user', address: '', userId
  });
  await loginUser(email, password);
  return user;
}

export async function loginUser(email, password) {
  const { account } = await getSDK();
  return await account.createEmailPasswordSession(email, password);
}

export async function logoutUser() {
  const { account } = await getSDK();
  return await account.deleteSession('current');
}

export async function getCurrentUser() {
  try {
    const { account, databases, sdk } = await getSDK();
    const user = await account.get();
    // Fetch user profile from DB
    try {
      const profile = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, user.$id);
      return { ...user, role: profile.role, address: profile.address, profile };
    } catch {
      return { ...user, role: 'user' };
    }
  } catch {
    return null;
  }
}

export async function updateUserProfile(userId, data) {
  const { databases } = await getSDK();
  return await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userId, data);
}

// ── PRODUCTS ─────────────────────────────────────────────────
export async function fetchProducts({ search = '', category = '', minPrice = 0, maxPrice = 99999, sort = 'newest', page = 1, limit = 20 } = {}) {
  const { databases, sdk } = await getSDK();
  const queries = [sdk.Query.limit(limit), sdk.Query.offset((page - 1) * limit)];
  if (category) queries.push(sdk.Query.equal('category', category));
  if (search) queries.push(sdk.Query.search('title', search));
  if (minPrice) queries.push(sdk.Query.greaterThanEqual('price', minPrice));
  if (maxPrice < 99999) queries.push(sdk.Query.lessThanEqual('price', maxPrice));
  if (sort === 'price-asc') queries.push(sdk.Query.orderAsc('price'));
  else if (sort === 'price-desc') queries.push(sdk.Query.orderDesc('price'));
  else queries.push(sdk.Query.orderDesc('$createdAt'));
  return await databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, queries);
}

export async function fetchProduct(id) {
  const { databases } = await getSDK();
  return await databases.getDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, id);
}

export async function createProduct(data) {
  const { databases, sdk } = await getSDK();
  return await databases.createDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, sdk.ID.unique(), data);
}

export async function updateProduct(id, data) {
  const { databases } = await getSDK();
  return await databases.updateDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, id, data);
}

export async function deleteProduct(id) {
  const { databases } = await getSDK();
  return await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, id);
}

export async function fetchFeaturedProducts(limit = 8) {
  const { databases, sdk } = await getSDK();
  return await databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, [
    sdk.Query.limit(limit), sdk.Query.orderDesc('rating')
  ]);
}

// ── STORAGE ──────────────────────────────────────────────────
export async function uploadProductImage(file) {
  const { storage, sdk } = await getSDK();
  return await storage.createFile(STORAGE_BUCKET_ID, sdk.ID.unique(), file);
}

export async function getProductImageUrl(fileId) {
  const { storage } = await getSDK();
  return storage.getFilePreview(STORAGE_BUCKET_ID, fileId, 600, 600);
}

export async function deleteProductImage(fileId) {
  const { storage } = await getSDK();
  return await storage.deleteFile(STORAGE_BUCKET_ID, fileId);
}

// ── CART ─────────────────────────────────────────────────────
export async function fetchCart(userId) {
  const { databases, sdk } = await getSDK();
  return await databases.listDocuments(DATABASE_ID, COLLECTIONS.CART, [
    sdk.Query.equal('userId', userId)
  ]);
}

export async function addToCart(userId, productId, quantity = 1) {
  const { databases, sdk } = await getSDK();
  // Check if item already exists
  const existing = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CART, [
    sdk.Query.equal('userId', userId),
    sdk.Query.equal('productId', productId)
  ]);
  if (existing.total > 0) {
    const item = existing.documents[0];
    return await databases.updateDocument(DATABASE_ID, COLLECTIONS.CART, item.$id, {
      quantity: item.quantity + quantity
    });
  }
  return await databases.createDocument(DATABASE_ID, COLLECTIONS.CART, sdk.ID.unique(), {
    userId, productId, quantity
  });
}

export async function updateCartItem(cartItemId, quantity) {
  const { databases } = await getSDK();
  return await databases.updateDocument(DATABASE_ID, COLLECTIONS.CART, cartItemId, { quantity });
}

export async function removeFromCart(cartItemId) {
  const { databases } = await getSDK();
  return await databases.deleteDocument(DATABASE_ID, COLLECTIONS.CART, cartItemId);
}

export async function clearCart(userId) {
  const cart = await fetchCart(userId);
  const promises = cart.documents.map(item => removeFromCart(item.$id));
  return await Promise.all(promises);
}

// ── ORDERS ───────────────────────────────────────────────────
export async function createOrder(userId, products, totalPrice, address) {
  const { databases, sdk } = await getSDK();
  return await databases.createDocument(DATABASE_ID, COLLECTIONS.ORDERS, sdk.ID.unique(), {
    userId,
    products: JSON.stringify(products),
    totalPrice,
    address,
    status: 'pending',
    createdAt: new Date().toISOString()
  });
}

export async function fetchUserOrders(userId) {
  const { databases, sdk } = await getSDK();
  return await databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS, [
    sdk.Query.equal('userId', userId),
    sdk.Query.orderDesc('$createdAt')
  ]);
}

export async function fetchAllOrders(limit = 50, page = 1) {
  const { databases, sdk } = await getSDK();
  return await databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS, [
    sdk.Query.limit(limit),
    sdk.Query.offset((page - 1) * limit),
    sdk.Query.orderDesc('$createdAt')
  ]);
}

export async function updateOrderStatus(orderId, status) {
  const { databases } = await getSDK();
  return await databases.updateDocument(DATABASE_ID, COLLECTIONS.ORDERS, orderId, { status });
}

// ── ADMIN: USERS ─────────────────────────────────────────────
export async function fetchAllUsers(limit = 50) {
  const { databases, sdk } = await getSDK();
  return await databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS, [
    sdk.Query.limit(limit),
    sdk.Query.orderDesc('$createdAt')
  ]);
}

export async function fetchDashboardStats() {
  const { databases, sdk } = await getSDK();
  const [products, users, orders] = await Promise.all([
    databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, [sdk.Query.limit(1)]),
    databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS, [sdk.Query.limit(1)]),
    databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS, [sdk.Query.limit(100)])
  ]);
  const revenue = orders.documents.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  return {
    totalProducts: products.total,
    totalUsers: users.total,
    totalOrders: orders.total,
    totalRevenue: revenue
  };
}

// ── HELPERS ──────────────────────────────────────────────────
export function formatPrice(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

export function getImageUrl(fileId) {
  if (!fileId) return '/assets/images/placeholder.png';
  return `${APPWRITE_ENDPOINT}/storage/buckets/${STORAGE_BUCKET_ID}/files/${fileId}/preview?project=${APPWRITE_PROJECT_ID}&width=600&height=600`;
}

export { COLLECTIONS, DATABASE_ID, STORAGE_BUCKET_ID, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID };
