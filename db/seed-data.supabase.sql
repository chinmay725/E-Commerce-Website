-- ============================================================
-- ShopKart Supabase Seed Data
-- PostgreSQL syntax — Run AFTER schema.supabase.sql
-- ============================================================

-- ================================================
-- CATEGORIES
-- ================================================
INSERT INTO public.categories (name, slug, description, icon, sort_order, is_active) VALUES
('Electronics', 'electronics', 'Latest gadgets and electronic devices', 'cpu', 1, 1),
('Fashion', 'fashion', 'Trendy clothing and accessories', 'shopping-bag', 2, 1),
('Home & Kitchen', 'home-kitchen', 'Furniture and home decor', 'home', 3, 1),
('Sports', 'sports', 'Sports equipment and fitness gear', 'activity', 4, 1),
('Books', 'books', 'Books and office supplies', 'book-open', 5, 1)
ON CONFLICT (name) DO NOTHING;

-- ================================================
-- BRANDS
-- ================================================
INSERT INTO public.brands (name, logo_url, is_active) VALUES
('TechBrand', NULL, 1),
('FashionHub', NULL, 1),
('HomeStyle', NULL, 1),
('SportPro', NULL, 1),
('BookWorld', NULL, 1)
ON CONFLICT (name) DO NOTHING;

-- ================================================
-- PRODUCTS (using subqueries for UUID category/brand IDs)
-- ================================================
INSERT INTO public.products
  (name, slug, description, short_description, category_id, brand_id, sku,
   price, mrp, cost_price, stock, min_stock_alert, weight_grams,
   thumbnail_url, avg_rating, review_count, is_featured, is_trending, is_active, tags, specifications)
VALUES

-- Electronics
('Wireless Bluetooth Headphones', 'wireless-bluetooth-headphones',
 'Premium wireless headphones with noise cancellation and 30-hour battery life. Features superior sound quality and comfortable fit for extended listening sessions.',
 'Premium wireless headphones with ANC',
 (SELECT id FROM public.categories WHERE slug='electronics'),
 (SELECT id FROM public.brands WHERE name='TechBrand'),
 'WBH-001', 2999.00, 3999.00, 1800.00, 50, 10, 250,
 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
 4.5, 128, 1, 1, 1, 'wireless,bluetooth,headphones,anc',
 '{"battery":"30 hours","noise_cancellation":"Yes","connectivity":"Bluetooth 5.0"}'),

('Smart Watch Pro', 'smart-watch-pro',
 'Advanced smartwatch with health monitoring, GPS tracking, and 7-day battery life. Water-resistant up to 50m.',
 'Advanced smartwatch with health tracking',
 (SELECT id FROM public.categories WHERE slug='electronics'),
 (SELECT id FROM public.brands WHERE name='TechBrand'),
 'SWP-002', 4999.00, 6999.00, 3000.00, 35, 8, 120,
 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
 4.3, 89, 1, 1, 1, 'smartwatch,fitness,gps,health',
 '{"battery":"7 days","water_resistant":"50m","display":"AMOLED"}'),

('Laptop Stand Aluminum', 'laptop-stand-aluminum',
 'Ergonomic aluminum laptop stand for better posture and cooling. Adjustable height and angle for comfortable viewing.',
 'Ergonomic aluminum laptop stand',
 (SELECT id FROM public.categories WHERE slug='electronics'),
 (SELECT id FROM public.brands WHERE name='TechBrand'),
 'LSA-003', 1499.00, 1999.00, 900.00, 80, 15, 450,
 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
 4.2, 56, 0, 0, 1, 'laptop,stand,ergonomic,aluminum',
 '{"material":"Aluminum","adjustable":"Yes","compatibility":"10-17 inch laptops"}'),

-- Fashion
('Classic Cotton T-Shirt', 'classic-cotton-t-shirt',
 '100% cotton comfortable t-shirt available in multiple colors. Breathable fabric perfect for everyday wear.',
 '100% cotton comfortable t-shirt',
 (SELECT id FROM public.categories WHERE slug='fashion'),
 (SELECT id FROM public.brands WHERE name='FashionHub'),
 'CCT-004', 599.00, 799.00, 250.00, 200, 30, 180,
 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
 4.1, 234, 0, 1, 1, 'tshirt,cotton,casual,comfortable',
 '{"material":"100% Cotton","sizes":"S,M,L,XL,XXL","care":"Machine washable"}'),

('Slim Fit Denim Jeans', 'slim-fit-denim-jeans',
 'Stylish slim fit jeans made from premium denim. Features stretch fabric for comfort and classic five-pocket design.',
 'Stylish slim fit denim jeans',
 (SELECT id FROM public.categories WHERE slug='fashion'),
 (SELECT id FROM public.brands WHERE name='FashionHub'),
 'SFDJ-005', 1299.00, 1799.00, 700.00, 120, 20, 500,
 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
 4.4, 178, 1, 0, 1, 'jeans,denim,slim-fit,casual',
 '{"material":"Denim with stretch","sizes":"28,30,32,34,36","style":"Five-pocket"}'),

('Running Shoes Pro', 'running-shoes-pro',
 'Lightweight running shoes with advanced cushioning and breathable mesh upper. Perfect for daily runs and workouts.',
 'Lightweight running shoes with cushioning',
 (SELECT id FROM public.categories WHERE slug='fashion'),
 (SELECT id FROM public.brands WHERE name='SportPro'),
 'RSP-006', 2499.00, 3499.00, 1500.00, 65, 12, 280,
 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
 4.6, 312, 1, 1, 1, 'shoes,running,athletic,comfortable',
 '{"upper":"Mesh","sole":"Rubber","cushioning":"Advanced foam"}'),

-- Home & Kitchen
('Modern Table Lamp', 'modern-table-lamp',
 'Elegant modern table lamp with adjustable brightness. LED bulb included, energy efficient with warm white light.',
 'Elegant modern table lamp',
 (SELECT id FROM public.categories WHERE slug='home-kitchen'),
 (SELECT id FROM public.brands WHERE name='HomeStyle'),
 'MTL-007', 899.00, 1299.00, 450.00, 45, 10, 850,
 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
 4.0, 67, 0, 0, 1, 'lamp,lighting,modern,led',
 '{"bulb":"LED included","brightness":"Adjustable","color":"Warm white"}'),

('Memory Foam Pillow', 'memory-foam-pillow',
 'Premium memory foam pillow for better sleep. Contoured design provides optimal neck and head support.',
 'Premium memory foam pillow',
 (SELECT id FROM public.categories WHERE slug='home-kitchen'),
 (SELECT id FROM public.brands WHERE name='HomeStyle'),
 'MFP-008', 1199.00, 1699.00, 650.00, 90, 18, 600,
 'https://images.unsplash.com/photo-1592789705501-f9ae4278a9c9?w=400',
 4.5, 145, 0, 1, 1, 'pillow,foam,sleep,comfortable',
 '{"material":"Memory foam","cover":"Removable","size":"Standard"}'),

('Ceramic Coffee Mug Set', 'ceramic-coffee-mug-set',
 'Set of 4 ceramic coffee mugs in elegant design. Microwave and dishwasher safe. Perfect for daily use.',
 'Set of 4 ceramic coffee mugs',
 (SELECT id FROM public.categories WHERE slug='home-kitchen'),
 (SELECT id FROM public.brands WHERE name='HomeStyle'),
 'CCMS-009', 699.00, 999.00, 350.00, 150, 25, 400,
 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400',
 4.3, 89, 0, 0, 1, 'mug,ceramic,coffee,kitchen',
 '{"quantity":"Set of 4","material":"Ceramic","safe":"Microwave & dishwasher"}'),

-- Sports
('Yoga Mat Premium', 'yoga-mat-premium',
 'Extra thick yoga mat with non-slip surface. Provides excellent cushioning for all types of yoga and exercises.',
 'Extra thick non-slip yoga mat',
 (SELECT id FROM public.categories WHERE slug='sports'),
 (SELECT id FROM public.brands WHERE name='SportPro'),
 'YMP-010', 999.00, 1499.00, 500.00, 100, 20, 1200,
 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400',
 4.4, 198, 1, 1, 1, 'yoga,mat,fitness,exercise',
 '{"thickness":"6mm","material":"TPE","size":"183cm x 61cm"}'),

('Resistance Bands Set', 'resistance-bands-set',
 'Set of 5 resistance bands with different strength levels. Perfect for home workouts, physical therapy, and strength training.',
 'Set of 5 resistance bands',
 (SELECT id FROM public.categories WHERE slug='sports'),
 (SELECT id FROM public.brands WHERE name='SportPro'),
 'RBS-011', 499.00, 799.00, 200.00, 180, 30, 200,
 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400',
 4.2, 156, 0, 0, 1, 'resistance,bands,fitness,home-workout',
 '{"quantity":"5 bands","levels":"Light to Extra Heavy","material":"Latex"}'),

('Dumbbell Set 5kg', 'dumbbell-set-5kg',
 'Pair of 5kg dumbbells with comfortable grip. Perfect for strength training at home. Durable neoprene coating.',
 'Pair of 5kg dumbbells',
 (SELECT id FROM public.categories WHERE slug='sports'),
 (SELECT id FROM public.brands WHERE name='SportPro'),
 'DS-012', 1499.00, 1999.00, 800.00, 60, 12, 5000,
 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
 4.5, 112, 0, 1, 1, 'dumbbell,weights,strength,fitness',
 '{"weight":"5kg each","coating":"Neoprene","grip":"Ergonomic"}'),

-- Books
('Premium Notebook Set', 'premium-notebook-set',
 'Set of 3 premium notebooks with high-quality paper. Lined pages, hardcover, perfect for journaling and note-taking.',
 'Set of 3 premium notebooks',
 (SELECT id FROM public.categories WHERE slug='books'),
 (SELECT id FROM public.brands WHERE name='BookWorld'),
 'PNS-013', 599.00, 899.00, 250.00, 130, 25, 350,
 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400',
 4.3, 87, 0, 0, 1, 'notebook,stationery,journal,paper',
 '{"quantity":"Set of 3","pages":"200 each","cover":"Hardcover"}'),

('Fountain Pen Set', 'fountain-pen-set',
 'Elegant fountain pen set with 3 ink cartridges. Smooth writing experience, perfect for signatures and calligraphy.',
 'Elegant fountain pen set',
 (SELECT id FROM public.categories WHERE slug='books'),
 (SELECT id FROM public.brands WHERE name='BookWorld'),
 'FPS-014', 1299.00, 1799.00, 600.00, 55, 10, 45,
 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400',
 4.6, 64, 1, 0, 1, 'pen,fountain,writing,stationery',
 '{"ink":"3 cartridges included","nib":"Steel","finish":"Metallic"}'),

('Desk Organizer', 'desk-organizer',
 'Multi-compartment desk organizer for office supplies. Keeps your workspace tidy and organized. Made from durable material.',
 'Multi-compartment desk organizer',
 (SELECT id FROM public.categories WHERE slug='books'),
 (SELECT id FROM public.brands WHERE name='BookWorld'),
 'DO-015', 799.00, 1099.00, 400.00, 85, 15, 650,
 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=400',
 4.1, 78, 0, 0, 1, 'organizer,desk,office,storage',
 '{"compartments":"Multiple","material":"Durable plastic","size":"Compact"}')

ON CONFLICT (slug) DO NOTHING;

-- ================================================
-- DEFAULT ADMIN USER
-- password: Admin@123 (bcrypt hash)
-- ================================================
INSERT INTO public.user_profiles (email, name, role, password_hash, is_active, is_verified)
VALUES (
  'admin@shopkart.com',
  'ShopKart Admin',
  'admin',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
  1,
  1
)
ON CONFLICT (email) DO NOTHING;
