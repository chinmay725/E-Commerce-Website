-- ShopKart E-Commerce Database Schema
-- SQLite

-- ================================================
-- USERS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE,
  phone         TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')),
  is_verified   INTEGER NOT NULL DEFAULT 0,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_role ON users(role);

-- ================================================
-- OTP TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS otp_codes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  phone      TEXT NOT NULL,
  code       TEXT NOT NULL,
  purpose    TEXT NOT NULL DEFAULT 'login' CHECK(purpose IN ('login','register','reset')),
  expires_at DATETIME NOT NULL,
  used       INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_phone_code ON otp_codes(phone, code);
CREATE INDEX IF NOT EXISTS idx_expires ON otp_codes(expires_at);

-- ================================================
-- ADDRESSES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS addresses (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL,
  label        TEXT DEFAULT 'Home',
  full_name    TEXT NOT NULL,
  phone        TEXT NOT NULL,
  line1        TEXT NOT NULL,
  line2        TEXT,
  city         TEXT NOT NULL,
  state        TEXT NOT NULL,
  pincode      TEXT NOT NULL,
  country      TEXT NOT NULL DEFAULT 'India',
  is_default   INTEGER NOT NULL DEFAULT 0,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user ON addresses(user_id);

-- ================================================
-- CATEGORIES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url   TEXT,
  icon        TEXT,
  parent_id   INTEGER,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_parent ON categories(parent_id);

-- ================================================
-- BRANDS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS brands (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,
  logo_url   TEXT,
  is_active  INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- PRODUCTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS products (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  description      TEXT,
  short_description TEXT,
  category_id      INTEGER NOT NULL,
  brand_id         INTEGER,
  sku              TEXT UNIQUE,
  price            REAL NOT NULL,
  mrp              REAL,
  cost_price       REAL,
  stock            INTEGER NOT NULL DEFAULT 0,
  min_stock_alert  INTEGER NOT NULL DEFAULT 5,
  weight_grams     INTEGER,
  thumbnail_url    TEXT,
  avg_rating       REAL NOT NULL DEFAULT 0.00,
  review_count     INTEGER NOT NULL DEFAULT 0,
  is_featured      INTEGER NOT NULL DEFAULT 0,
  is_trending      INTEGER NOT NULL DEFAULT 0,
  is_active        INTEGER NOT NULL DEFAULT 1,
  tags             TEXT,
  specifications   TEXT,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (brand_id)    REFERENCES brands(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_price ON products(price);

-- ================================================
-- PRODUCT IMAGES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS product_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  url        TEXT NOT NULL,
  alt_text   TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product ON product_images(product_id);

-- ================================================
-- REVIEWS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS reviews (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  user_id    INTEGER NOT NULL,
  order_id   INTEGER,
  rating     INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  title      TEXT,
  body       TEXT,
  images     TEXT,
  is_verified INTEGER NOT NULL DEFAULT 0,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_rating ON reviews(product_id, rating);

-- ================================================
-- CART TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity   INTEGER NOT NULL DEFAULT 1,
  added_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_user_cart ON cart_items(user_id);

-- ================================================
-- WISHLIST TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS wishlist_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  added_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_user_wishlist ON wishlist_items(user_id);

-- ================================================
-- ORDERS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS orders (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number     TEXT NOT NULL UNIQUE,
  user_id          INTEGER NOT NULL,
  address_id       INTEGER,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  payment_method   TEXT NOT NULL DEFAULT 'cod' CHECK(payment_method IN ('cod','upi','card','netbanking','wallet')),
  payment_status   TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending','paid','failed','refunded')),
  payment_ref      TEXT,
  subtotal         REAL NOT NULL,
  discount         REAL NOT NULL DEFAULT 0.00,
  shipping_charge  REAL NOT NULL DEFAULT 0.00,
  tax              REAL NOT NULL DEFAULT 0.00,
  total            REAL NOT NULL,
  coupon_code      TEXT,
  notes            TEXT,
  estimated_delivery TEXT,
  delivered_at     DATETIME,
  cancelled_at     DATETIME,
  cancel_reason    TEXT,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id),
  FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_orders ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_created_orders ON orders(created_at);

-- ================================================
-- ORDER ITEMS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS order_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id     INTEGER NOT NULL,
  product_id   INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  product_sku  TEXT,
  thumbnail    TEXT,
  quantity     INTEGER NOT NULL,
  unit_price   REAL NOT NULL,
  mrp          REAL,
  subtotal     REAL NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_product_order_items ON order_items(product_id);

-- ================================================
-- SEED DATA
-- ================================================

INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('Mobiles',       'mobiles',    'smartphone', 1),
  ('Appliances',    'appliances', 'zap',        2),
  ('Sports',        'sports',     'activity',   3),
  ('Health',        'health',     'heart',      4),
  ('Fashion',       'fashion',    'shopping-bag',5),
  ('Electronics',   'electronics','cpu',        6),
  ('Books',         'books',      'book-open',  7),
  ('Home & Kitchen','home-kitchen','home',      8);

INSERT INTO brands (name) VALUES
  ('Apple'),('Samsung'),('OnePlus'),('Realme'),('Xiaomi'),
  ('Adidas'),('Nike'),('Puma'),('Boat'),('Sony'),
  ('LG'),('Philips'),('Prestige'),('Lifelong'),('Himalaya');

INSERT INTO users (name, email, phone, password_hash, role, is_verified) VALUES
  ('Admin User',  'admin@shopkart.com',  '9000000000', '$2b$10$placeholder_admin_hash',  'admin', 1),
  ('Test User',   'user@shopkart.com',   '9000000001', '$2b$10$placeholder_user_hash',   'user',  1);
