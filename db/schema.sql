-- ShopKart E-Commerce Database Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS shopkart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shopkart;

-- ================================================
-- USERS TABLE
-- ================================================
CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE,
  phone         VARCHAR(15) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  avatar_url    VARCHAR(500),
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  is_verified   TINYINT(1) NOT NULL DEFAULT 0,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_email (email),
  INDEX idx_role  (role)
) ENGINE=InnoDB;

-- ================================================
-- OTP TABLE
-- ================================================
CREATE TABLE otp_codes (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  phone      VARCHAR(15) NOT NULL,
  code       VARCHAR(6) NOT NULL,
  purpose    ENUM('login','register','reset') NOT NULL DEFAULT 'login',
  expires_at DATETIME NOT NULL,
  used       TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_phone_code (phone, code),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- ================================================
-- ADDRESSES TABLE
-- ================================================
CREATE TABLE addresses (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,
  label        VARCHAR(50) DEFAULT 'Home',
  full_name    VARCHAR(100) NOT NULL,
  phone        VARCHAR(15) NOT NULL,
  line1        VARCHAR(255) NOT NULL,
  line2        VARCHAR(255),
  city         VARCHAR(100) NOT NULL,
  state        VARCHAR(100) NOT NULL,
  pincode      VARCHAR(10) NOT NULL,
  country      VARCHAR(50) NOT NULL DEFAULT 'India',
  is_default   TINYINT(1) NOT NULL DEFAULT 0,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- ================================================
-- CATEGORIES TABLE
-- ================================================
CREATE TABLE categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  slug        VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  image_url   VARCHAR(500),
  icon        VARCHAR(50),
  parent_id   INT UNSIGNED,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_slug (slug),
  INDEX idx_parent (parent_id)
) ENGINE=InnoDB;

-- ================================================
-- BRANDS TABLE
-- ================================================
CREATE TABLE brands (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  logo_url   VARCHAR(500),
  is_active  TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ================================================
-- PRODUCTS TABLE
-- ================================================
CREATE TABLE products (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(255) NOT NULL,
  slug             VARCHAR(300) NOT NULL UNIQUE,
  description      TEXT,
  short_description VARCHAR(500),
  category_id      INT UNSIGNED NOT NULL,
  brand_id         INT UNSIGNED,
  sku              VARCHAR(100) UNIQUE,
  price            DECIMAL(10,2) NOT NULL,
  mrp              DECIMAL(10,2),
  cost_price       DECIMAL(10,2),
  stock            INT NOT NULL DEFAULT 0,
  min_stock_alert  INT NOT NULL DEFAULT 5,
  weight_grams     INT,
  thumbnail_url    VARCHAR(500),
  avg_rating       DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  review_count     INT NOT NULL DEFAULT 0,
  is_featured      TINYINT(1) NOT NULL DEFAULT 0,
  is_trending      TINYINT(1) NOT NULL DEFAULT 0,
  is_active        TINYINT(1) NOT NULL DEFAULT 1,
  tags             JSON,
  specifications   JSON,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (brand_id)    REFERENCES brands(id) ON DELETE SET NULL,
  INDEX idx_category (category_id),
  INDEX idx_brand (brand_id),
  INDEX idx_featured (is_featured),
  INDEX idx_price (price),
  FULLTEXT INDEX ft_search (name, description, tags)
) ENGINE=InnoDB;

-- ================================================
-- PRODUCT IMAGES TABLE
-- ================================================
CREATE TABLE product_images (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  url        VARCHAR(500) NOT NULL,
  alt_text   VARCHAR(255),
  sort_order INT NOT NULL DEFAULT 0,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product (product_id)
) ENGINE=InnoDB;

-- ================================================
-- REVIEWS TABLE
-- ================================================
CREATE TABLE reviews (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  order_id   INT UNSIGNED,
  rating     TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title      VARCHAR(200),
  body       TEXT,
  images     JSON,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  helpful_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_product (user_id, product_id),
  INDEX idx_product_rating (product_id, rating)
) ENGINE=InnoDB;

-- ================================================
-- CART TABLE
-- ================================================
CREATE TABLE cart_items (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity   SMALLINT NOT NULL DEFAULT 1,
  added_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_product (user_id, product_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- ================================================
-- WISHLIST TABLE
-- ================================================
CREATE TABLE wishlist_items (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  added_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_product (user_id, product_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- ================================================
-- ORDERS TABLE
-- ================================================
CREATE TABLE orders (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number     VARCHAR(30) NOT NULL UNIQUE,
  user_id          INT UNSIGNED NOT NULL,
  address_id       INT UNSIGNED,
  status           ENUM('pending','confirmed','processing','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'pending',
  payment_method   ENUM('cod','upi','card','netbanking','wallet') NOT NULL DEFAULT 'cod',
  payment_status   ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  payment_ref      VARCHAR(100),
  subtotal         DECIMAL(10,2) NOT NULL,
  discount         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  shipping_charge  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax              DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total            DECIMAL(10,2) NOT NULL,
  coupon_code      VARCHAR(30),
  notes            TEXT,
  estimated_delivery DATE,
  delivered_at     DATETIME,
  cancelled_at     DATETIME,
  cancel_reason    VARCHAR(255),
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id),
  FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL,
  INDEX idx_user   (user_id),
  INDEX idx_status (status),
  INDEX idx_created(created_at)
) ENGINE=InnoDB;

-- ================================================
-- ORDER ITEMS TABLE
-- ================================================
CREATE TABLE order_items (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id     INT UNSIGNED NOT NULL,
  product_id   INT UNSIGNED NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_sku  VARCHAR(100),
  thumbnail    VARCHAR(500),
  quantity     SMALLINT NOT NULL,
  unit_price   DECIMAL(10,2) NOT NULL,
  mrp          DECIMAL(10,2),
  subtotal     DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_order   (order_id),
  INDEX idx_product (product_id)
) ENGINE=InnoDB;

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

-- Triggers to update product avg_rating on review insert/update/delete
DELIMITER $$
CREATE TRIGGER trg_review_insert AFTER INSERT ON reviews
FOR EACH ROW BEGIN
  UPDATE products SET
    avg_rating   = (SELECT ROUND(AVG(rating),2) FROM reviews WHERE product_id = NEW.product_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = NEW.product_id)
  WHERE id = NEW.product_id;
END$$

CREATE TRIGGER trg_review_update AFTER UPDATE ON reviews
FOR EACH ROW BEGIN
  UPDATE products SET
    avg_rating   = (SELECT ROUND(AVG(rating),2) FROM reviews WHERE product_id = NEW.product_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = NEW.product_id)
  WHERE id = NEW.product_id;
END$$

CREATE TRIGGER trg_review_delete AFTER DELETE ON reviews
FOR EACH ROW BEGIN
  UPDATE products SET
    avg_rating   = COALESCE((SELECT ROUND(AVG(rating),2) FROM reviews WHERE product_id = OLD.product_id), 0),
    review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = OLD.product_id)
  WHERE id = OLD.product_id;
END$$
DELIMITER ;
