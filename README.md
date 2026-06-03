# 🛍️ ShopKart — Industry-Level E-Commerce Platform

> A full-stack, production-ready e-commerce web application built as a Final Year Engineering Project.
> Inspired by Flipkart, Amazon & Myntra — featuring modern UI, animations, admin panel & Docker support.

---

## 📸 Tech Stack

| Layer       | Technology                           |
|-------------|--------------------------------------|
| Frontend    | React 18, Framer Motion, CSS3        |
| Backend     | Node.js 18, Express.js 4             |
| Database    | Supabase (Postgres schema)           |
| Auth        | JWT + Email OTP (Nodemailer SMTP)    |
| Images      | Cloudinary (or local storage)        |
| Container   | Docker + Docker Compose              |
| Web Server  | Nginx (production frontend)          |

---

## 📁 Project Structure

```
shopkart/
├── frontend/                  # React Application
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar/        # Navbar with search, cart, user menu
│   │   │   ├── ProductCard/   # Animated product card + skeleton
│   │   │   ├── Cart/          # Slide-in cart sidebar
│   │   │   └── Footer/        # Responsive footer
│   │   ├── context/
│   │   │   ├── AuthContext.js # JWT auth state
│   │   │   └── CartContext.js # Cart state management
│   │   ├── pages/
│   │   │   ├── Home.jsx       # Hero, categories, featured
│   │   │   ├── Products.jsx   # Listing with filters & pagination
│   │   │   ├── ProductDetail.jsx  # Detail with zoom, reviews
│   │   │   ├── Login.jsx      # OTP + Admin login
│   │   │   ├── Checkout.jsx   # Address + payment
│   │   │   ├── Admin.jsx      # Full admin dashboard
│   │   │   └── OtherPages.jsx # Cart, Orders, Dashboard
│   │   ├── utils/
│   │   │   └── api.js         # Axios instance with interceptors
│   │   ├── styles/
│   │   │   └── globals.css    # Design system (light/dark)
│   │   ├── App.js             # Routes + providers
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
│
├── backend/                   # Express REST API
│   ├── config/
│   │   └── db.js              # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js  # OTP + JWT auth
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   └── adminController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   └── allRoutes.js       # Cart, orders, users, admin, reviews
│   ├── middleware/
│   │   ├── auth.js            # JWT protect, adminOnly, optionalAuth
│   │   └── upload.js          # Multer + Cloudinary
│   ├── server.js              # Express app entry
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── mysql/
│   └── schema.sql             # Complete DB schema + seed data
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### Option A — Docker (Recommended, zero setup)

```bash
# 1. Clone the project
git clone <your-repo-url>
cd shopkart

# 2. Copy and configure environment
cp backend/.env.example .env

# 3. Launch all services
docker-compose up --build

# App running at:
#   Frontend → http://localhost:3000
#   Backend  → http://localhost:5000
#   MySQL    → localhost:3306
```

### Option B — Local Development

#### Prerequisites
- Node.js ≥ 18
- MySQL 8.0
- npm or yarn

#### 1. Database Setup
```sql
mysql -u root -p
CREATE DATABASE shopkart;
exit

mysql -u root -p shopkart < mysql/schema.sql
```

#### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials and secrets

npm install
npm run dev    # Starts on http://localhost:5000
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm start      # Starts on http://localhost:3000
```

---

## 🔐 Default Admin Credentials

| Field    | Value                    |
|----------|--------------------------|
| Email    | admin@shopkart.com       |
| Password | *(set via bcrypt hash)*  |

> **Note:** For OTP login in development, OTPs are printed to the backend console (no Twilio needed).

To set admin password:
```bash
node -e "const b=require('bcryptjs'); console.log(b.hashSync('Admin@123', 10))"
# Copy the hash and update in MySQL:
# UPDATE users SET password_hash='<hash>' WHERE email='admin@shopkart.com';
```

---

## 🌐 API Reference

### Auth
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| POST   | /api/auth/send-otp    | Send OTP to phone        |
| POST   | /api/auth/verify-otp  | Verify OTP & get token   |
| POST   | /api/auth/login       | Admin email+password     |
| GET    | /api/auth/me          | Get current user         |
| PUT    | /api/auth/profile     | Update profile           |

### Products
| Method | Endpoint                          | Description       |
|--------|-----------------------------------|-------------------|
| GET    | /api/products                     | List with filters |
| GET    | /api/products/:slug               | Product detail    |
| GET    | /api/products/search/suggestions  | Search autocomplete|
| POST   | /api/products *(admin)*           | Create product    |
| PUT    | /api/products/:id *(admin)*       | Update product    |
| DELETE | /api/products/:id *(admin)*       | Soft delete       |

### Cart
| Method | Endpoint        | Description       |
|--------|-----------------|-------------------|
| GET    | /api/cart       | Get cart          |
| POST   | /api/cart       | Add item          |
| PATCH  | /api/cart/:id   | Update quantity   |
| DELETE | /api/cart/:id   | Remove item       |
| DELETE | /api/cart       | Clear cart        |

### Orders
| Method | Endpoint                 | Description    |
|--------|--------------------------|----------------|
| POST   | /api/orders              | Place order    |
| GET    | /api/orders              | My orders      |
| GET    | /api/orders/:id          | Order detail   |
| PATCH  | /api/orders/:id/cancel   | Cancel order   |

### Admin
| Method | Endpoint                         | Description          |
|--------|----------------------------------|----------------------|
| GET    | /api/admin/dashboard             | Stats + charts       |
| GET    | /api/admin/orders                | All orders           |
| PATCH  | /api/admin/orders/:id/status     | Update order status  |
| GET    | /api/admin/users                 | All users            |
| GET    | /api/admin/products              | All products         |
| GET    | /api/admin/stock-alerts          | Low stock alert      |

---

## ✨ Features

### Customer Features
- ✉️ Email OTP Verification (prioritizes local SMTP config to send 6-digit codes; falls back to Supabase/Console)
- 🛒 Persistent cart with quantity management
- ❤️ Wishlist
- 📦 Order placement & tracking
- 🔍 Real-time search with suggestions
- 🌙 Dark / Light mode toggle
- 📲 Fully responsive (mobile-first)
- 📄 Dedicated static pages: About Us, Careers (with application triggers), Press & News, Blog, interactive FAQs, Contact Us (with form handling), Returns Policy, Privacy Policy, Terms of Use, Sitemap

### Admin Features
- ➕ Add products dynamically (no code required)
- ✏️ Edit / deactivate products
- 📊 Revenue dashboard with stats
- 🔄 Update order statuses
- 👥 User management
- ⚠️ Low stock alerts

### Technical Features
- JWT stateless authentication
- Supabase (Postgres) database integration
- SMTP / Nodemailer transactional emails (with custom templates)
- Rate limiting on API
- Helmet security headers
- Compression middleware
- Lazy-loaded React pages
- Framer Motion animations
- Skeleton loaders

---

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Rebuild after code changes
docker-compose up --build

# Stop all
docker-compose down

# Remove volumes (fresh DB)
docker-compose down -v
```

---

## 🌍 Environment Variables

```env
# Backend (backend/.env)
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=shopkart
JWT_SECRET=your_super_secret_min_32_chars
TWILIO_ACCOUNT_SID=           # Optional for dev
TWILIO_AUTH_TOKEN=            # Optional for dev
CLOUDINARY_CLOUD_NAME=        # Optional – uses local if empty
CLIENT_URL=http://localhost:3000

# Frontend (.env)
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🎨 Design System

| Token          | Value                    |
|----------------|--------------------------|
| Primary Color  | `#FF3E3E` (Shopkart Red) |
| Accent         | `#FF9500`                |
| Success        | `#00B37D`                |
| Font Display   | Syne                     |
| Font Body      | DM Sans                  |
| Border Radius  | 6px — 28px scale         |
| Transitions    | cubic-bezier(.4,0,.2,1)  |

---

## 📝 License

MIT © 2024 ShopKart. Built for Final Year Engineering Project.
