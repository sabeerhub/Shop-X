# shop-X 🛍️

A fully functional, production-style e-commerce web application built with **Vanilla JavaScript** and **Appwrite** as the backend.

## ✨ Features

### User Store
- 🏠 **Home Page** — Hero banner, featured products, category grid
- 🛍️ **Products Page** — Search, filter by category, price filter, sorting, pagination
- 📱 **Product Detail** — Image gallery, ratings, quantity control, quick view modal
- 🛒 **Cart** — Add/remove/update items, linked to user account
- 💳 **Checkout** — Shipping address, order summary, order creation
- 📦 **Orders** — Order history with status tracking
- 👤 **Profile** — Edit name and delivery address

### Admin Dashboard
- 📊 **Dashboard** — Live stats: products, users, orders, revenue
- 📦 **Products** — List, add, edit, delete products with image upload
- 🛒 **Orders** — View all orders, update order status
- 👥 **Users** — View all registered users

### Technical Features
- 🔐 Appwrite Authentication (register, login, logout, persistent session)
- 🗄️ Appwrite Database (products, cart, orders, users)
- 📂 Appwrite Storage (product image upload)
- 🔒 Admin-only protected routes
- 📱 Fully responsive mobile-first design
- ⚡ Lazy loading images
- 💀 Skeleton loading screens
- 🔔 Toast notifications
- 🔍 Debounced search

---

## 🚀 Setup Guide

### Step 1: Create Appwrite Project

1. Go to [cloud.appwrite.io](https://cloud.appwrite.io) and sign up
2. Create a new project — note your **Project ID**
3. Add your domain to **Platforms** (e.g. `localhost` for dev, your domain for prod)

### Step 2: Configure `js/appwrite.js`

Open `js/appwrite.js` and replace:
```js
const APPWRITE_PROJECT_ID = 'YOUR_PROJECT_ID'; // ← paste your Project ID here
```

### Step 3: Create Database

In Appwrite Console → **Databases** → Create database with ID: `shopx-db`

#### Create Collections:

**`users` collection**
| Attribute | Type | Required |
|-----------|------|----------|
| name | String 255 | ✓ |
| email | String 320 | ✓ |
| role | String 20 | ✓ (default: "user") |
| address | String 1000 | |
| userId | String 36 | ✓ |

**`products` collection**
| Attribute | Type | Required |
|-----------|------|----------|
| title | String 500 | ✓ |
| description | String 5000 | |
| price | Double | ✓ |
| originalPrice | Double | |
| category | String 100 | ✓ |
| stock | Integer | ✓ |
| image | String 36 | |
| rating | Double | |
| reviewCount | Integer | |

**`cart` collection**
| Attribute | Type | Required |
|-----------|------|----------|
| userId | String 36 | ✓ |
| productId | String 36 | ✓ |
| quantity | Integer | ✓ |

**`orders` collection**
| Attribute | Type | Required |
|-----------|------|----------|
| userId | String 36 | ✓ |
| products | String 10000 | ✓ |
| totalPrice | Double | ✓ |
| address | String 1000 | |
| status | String 50 | ✓ (default: "pending") |
| createdAt | String 50 | ✓ |

#### Add Indexes (for products):
- `title` — Fulltext index (for search)
- `category` — Key index
- `price` — Key index
- `$createdAt` — Key index

For `cart`: Index on `userId`
For `orders`: Index on `userId`

### Step 4: Set Collection Permissions

For each collection set these permissions:
- **Create**: Users (`role:user`)  
- **Read**: Users (`role:user`) — or Any for products
- **Update**: Users (`role:user`)
- **Delete**: Users (`role:user`)

For `users` collection, set document-level security so users can only access their own documents.

### Step 5: Create Storage Bucket

In Appwrite Console → **Storage** → Create bucket with ID: `product-images`

Set permissions:
- **Create**: Users (for admin uploads)
- **Read**: Any (public product images)
- **Update**: Users
- **Delete**: Users

Enable file extensions: `jpg, jpeg, png, webp, gif`

### Step 6: Set Admin User

After registering your first user, manually update their `role` field in the Appwrite console from `user` to `admin`.

### Step 7: Deploy

**GitHub Pages:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_REPO_URL
git push origin main
# Enable GitHub Pages in Settings → Pages
```

**Vercel:**
```bash
vercel deploy
```

**Local Dev:**
```bash
# Use any static file server
npx serve .
# or
python -m http.server 8080
```

---

## 📁 Project Structure

```
shop-X/
├── index.html              # Home page
├── products.html           # Product listing
├── product.html            # Product detail
├── cart.html               # Shopping cart
├── checkout.html           # Checkout
├── orders.html             # Order history
├── login.html              # Login
├── register.html           # Register
├── profile.html            # User profile
├── admin/
│   ├── dashboard.html      # Admin dashboard
│   ├── products.html       # Manage products
│   ├── add-product.html    # Add/edit product
│   ├── orders.html         # Manage orders
│   └── users.html          # View users
├── css/
│   ├── style.css           # Main styles
│   ├── admin.css           # Admin styles
│   └── components.css      # Shared components
├── js/
│   ├── appwrite.js         # Appwrite API layer
│   ├── auth.js             # Authentication module
│   ├── products.js         # Product rendering
│   ├── cart.js             # Cart management
│   ├── checkout.js         # Checkout flow
│   ├── orders.js           # Order display
│   ├── admin.js            # Admin functions
│   └── ui.js               # UI utilities
└── assets/
    └── images/
        └── placeholder.svg
```

---

## 🎨 Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES Modules)
- **Backend**: [Appwrite](https://appwrite.io) (BaaS)
- **Fonts**: Syne (display), DM Sans (body)
- **Deployment**: GitHub Pages / Vercel

## 📄 License

MIT — free to use and modify.
