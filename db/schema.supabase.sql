-- ShopKart Supabase Database Schema
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- USERS TABLE (using Supabase Auth)
-- ================================================
-- Note: Supabase Auth manages users in auth.users
-- We'll create a public profile table linked to auth.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT UNIQUE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- ADDRESSES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'India',
  is_default INTEGER DEFAULT 0 CHECK (is_default IN (0, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);

-- ================================================
-- CATEGORIES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  icon TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);

-- ================================================
-- BRANDS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- PRODUCTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  sku TEXT UNIQUE,
  price NUMERIC(10,2) NOT NULL,
  mrp NUMERIC(10,2),
  cost_price NUMERIC(10,2),
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock_alert INTEGER NOT NULL DEFAULT 5,
  weight_grams INTEGER,
  thumbnail_url TEXT,
  avg_rating NUMERIC(3,2) DEFAULT 0.00 CHECK (avg_rating >= 0 AND avg_rating <= 5),
  review_count INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0 CHECK (is_featured IN (0, 1)),
  is_trending INTEGER DEFAULT 0 CHECK (is_trending IN (0, 1)),
  is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
  tags TEXT,
  specifications JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- ================================================
-- PRODUCT IMAGES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary INTEGER DEFAULT 0 CHECK (is_primary IN (0, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);

-- ================================================
-- REVIEWS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  order_id UUID,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  images TEXT,
  is_verified INTEGER DEFAULT 0 CHECK (is_verified IN (0, 1)),
  is_approved INTEGER DEFAULT 1 CHECK (is_approved IN (0, 1)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);

-- ================================================
-- CART ITEMS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_user ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_product ON public.cart_items(product_id);

-- ================================================
-- WISHLIST ITEMS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product ON public.wishlist_items(product_id);

-- ================================================
-- ORDERS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  total_amount NUMERIC(10,2) NOT NULL,
  shipping_amount NUMERIC(10,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  
  -- Shipping address
  shipping_full_name TEXT NOT NULL,
  shipping_phone TEXT NOT NULL,
  shipping_address_line1 TEXT NOT NULL,
  shipping_address_line2 TEXT,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT DEFAULT 'India',
  
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id TEXT,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);

-- ================================================
-- ORDER ITEMS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  product_sku TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(10,2) NOT NULL,
  mrp NUMERIC(10,2),
  discount NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);

-- ================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- User profiles: Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Addresses: Users can CRUD their own addresses
CREATE POLICY "Users can view own addresses" ON public.addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own addresses" ON public.addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" ON public.addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses" ON public.addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Categories: Public read, admin write
CREATE POLICY "Public can view categories" ON public.categories
  FOR SELECT USING (true);

-- Brands: Public read, admin write
CREATE POLICY "Public can view brands" ON public.brands
  FOR SELECT USING (true);

-- Products: Public read, admin write
CREATE POLICY "Public can view products" ON public.products
  FOR SELECT USING (is_active = 1);

CREATE POLICY "Public can view product images" ON public.product_images
  FOR SELECT USING (true);

-- Reviews: Public read, users can create own
CREATE POLICY "Public can view approved reviews" ON public.reviews
  FOR SELECT USING (is_approved = 1);

CREATE POLICY "Users can create own reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Cart: Users can CRUD own cart
CREATE POLICY "Users can view own cart" ON public.cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own cart" ON public.cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart" ON public.cart_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own cart" ON public.cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- Wishlist: Users can CRUD own wishlist
CREATE POLICY "Users can view own wishlist" ON public.wishlist_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own wishlist" ON public.wishlist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own wishlist" ON public.wishlist_items
  FOR DELETE USING (auth.uid() = user_id);

-- Orders: Users can view own orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- ================================================
-- TRIGGERS FOR UPDATED_AT
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- TRIGGER TO CREATE USER PROFILE ON SIGNUP
-- ================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- TRIGGER TO UPDATE PRODUCT RATINGS
-- ================================================
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET avg_rating = COALESCE(
    (SELECT AVG(rating) FROM public.reviews WHERE product_id = NEW.product_id AND is_approved = 1),
    0
  ),
  review_count = (
    SELECT COUNT(*) FROM public.reviews WHERE product_id = NEW.product_id AND is_approved = 1
  )
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_rating
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();
