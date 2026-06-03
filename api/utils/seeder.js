/**
 * ShopKart — Database Seeder (Supabase)
 * Run: cd api && npm run seed
 *
 * Seeds realistic products across all categories
 * so the store looks populated out of the box.
 */
require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');

const products = [
  /* ── MOBILES ─────────────────────────── */
  {
    name: 'Apple iPhone 15 Pro Max',
    short_description: 'Titanium design, A17 Pro chip, 48MP camera',
    description: 'The iPhone 15 Pro Max features a strong and light titanium design, the A17 Pro chip for incredible performance, a 48MP main camera with 5x telephoto zoom, and Action button.',
    category: 'mobiles', brand: 'Apple',
    price: 159900, mrp: 174900, stock: 25,
    is_featured: true, is_trending: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1695048133142-1a20484bce71?w=400&q=80',
    specifications: { Display: '6.7" Super Retina XDR OLED', Chip: 'A17 Pro', Storage: '256GB', Camera: '48MP + 12MP + 12MP', Battery: '4422 mAh', OS: 'iOS 17' },
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    short_description: 'Titanium frame, S Pen, 200MP camera',
    description: 'Galaxy S24 Ultra with built-in S Pen, 200MP camera, AI-powered features, and the fastest mobile processor from Samsung.',
    category: 'mobiles', brand: 'Samsung',
    price: 134999, mrp: 149999, stock: 18,
    is_featured: true, is_trending: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1706439155267-30afa6379a5e?w=400&q=80',
    specifications: { Display: '6.8" Dynamic AMOLED 2X', Processor: 'Snapdragon 8 Gen 3', Storage: '256GB', Camera: '200MP + 12MP + 50MP + 10MP', Battery: '5000 mAh' },
  },
  {
    name: 'OnePlus 12',
    short_description: 'Snapdragon 8 Gen 3, 50W wireless charging',
    description: 'OnePlus 12 with Hasselblad cameras, 100W SUPERVOOC fast charging, and a stunning 2K ProXDR display.',
    category: 'mobiles', brand: 'OnePlus',
    price: 64999, mrp: 69999, stock: 30,
    is_trending: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80',
    specifications: { Display: '6.82" LTPO AMOLED', Processor: 'Snapdragon 8 Gen 3', Storage: '256GB', Camera: '50MP + 48MP + 64MP', Battery: '5400 mAh', Charging: '100W SUPERVOOC' },
  },
  {
    name: 'Realme 12 Pro+',
    short_description: 'Periscope telephoto, 67W fast charge',
    description: 'Premium mid-range phone with periscope telephoto camera and leatherback design.',
    category: 'mobiles', brand: 'Realme',
    price: 29999, mrp: 34999, stock: 45,
    is_featured: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&q=80',
    specifications: { Display: '6.7" AMOLED', Processor: 'Snapdragon 7s Gen 2', Camera: '50MP + 64MP periscope + 8MP', Battery: '5000 mAh', Charging: '67W' },
  },
  {
    name: 'Xiaomi 14 Ultra',
    short_description: 'Leica cameras, Snapdragon 8 Gen 3',
    description: 'Flagship Xiaomi with Leica professional cinema cameras, titanium design, and 90W HyperCharge.',
    category: 'mobiles', brand: 'Xiaomi',
    price: 99999, mrp: 109999, stock: 15,
    is_trending: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80',
    specifications: { Display: '6.73" LTPO AMOLED', Processor: 'Snapdragon 8 Gen 3', Camera: '50MP Leica quad camera', Battery: '5300 mAh', Charging: '90W' },
  },

  /* ── ELECTRONICS ─────────────────────── */
  {
    name: 'Sony WH-1000XM5 Headphones',
    short_description: '30hr battery, industry-leading noise cancellation',
    description: 'Sony WH-1000XM5 with 8 microphones, Auto NC Optimizer, Multipoint connection, and 30 hours battery life.',
    category: 'electronics', brand: 'Sony',
    price: 24990, mrp: 29990, stock: 50,
    is_featured: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    specifications: { 'Driver Unit': '30mm', 'Battery Life': '30 hours', 'Noise Cancellation': 'Yes', Connectivity: 'Bluetooth 5.2', Weight: '250g' },
  },
  {
    name: 'boAt Airdopes 141',
    short_description: 'ENx™ tech, 42hrs total playback',
    description: 'True wireless earbuds with ENx™ Environmental Noise Cancellation, BEAST™ Mode for gaming, and 42-hour total playback.',
    category: 'electronics', brand: 'Boat',
    price: 1299, mrp: 2990, stock: 200,
    is_featured: true, is_trending: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80',
    specifications: { Driver: '8mm', Battery: '42 hrs total', Connectivity: 'Bluetooth 5.2', 'Water Resistance': 'IPX4' },
  },
  {
    name: 'Apple MacBook Air M3',
    short_description: '18hr battery, 13.6" Liquid Retina, M3 chip',
    description: 'MacBook Air with M3 chip delivers up to 18 hours of battery life, 13.6-inch Liquid Retina display, and the power to handle demanding workloads.',
    category: 'electronics', brand: 'Apple',
    price: 114900, mrp: 124900, stock: 20,
    is_featured: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
    specifications: { Chip: 'Apple M3', RAM: '8GB Unified', Storage: '256GB SSD', Display: '13.6" Liquid Retina', Battery: '18 hrs', Weight: '1.24 kg' },
  },

  /* ── FASHION ─────────────────────────── */
  {
    name: 'Nike Air Max 270',
    short_description: "Nike's largest Air unit, all-day comfort",
    description: "Nike Air Max 270 draws inspiration from Air Max heritage, featuring Nike's biggest heel Air unit yet for a super-soft ride.",
    category: 'fashion', brand: 'Nike',
    price: 12995, mrp: 14995, stock: 60,
    is_featured: true, is_trending: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
    specifications: { Material: 'Mesh upper', Sole: 'Air-cushioned', Available: 'Unisex', Closure: 'Lace-up' },
  },
  {
    name: 'Adidas Ultraboost 23',
    short_description: 'BOOST cushioning, PRIMEKNIT upper',
    description: 'Experience epic energy return with the Ultraboost 23, featuring responsive BOOST midsole and adaptive PRIMEKNIT upper.',
    category: 'fashion', brand: 'Adidas',
    price: 16999, mrp: 19999, stock: 40,
    is_trending: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1556906781-9a412961a2aa?w=400&q=80',
    specifications: { Upper: 'PRIMEKNIT+', Midsole: 'BOOST', Weight: '310g', Drop: '10mm', Type: 'Running' },
  },
  {
    name: 'Puma Classic Polo T-Shirt',
    short_description: '100% cotton, relaxed fit, moisture-wicking',
    description: 'Classic polo with Puma Cat Logo, crafted from 100% breathable cotton for everyday comfort.',
    category: 'fashion', brand: 'Puma',
    price: 1299, mrp: 1999, stock: 120,
    is_featured: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
    specifications: { Material: '100% Cotton', Fit: 'Relaxed', Occasion: 'Casual', Care: 'Machine washable' },
  },

  /* ── SPORTS ──────────────────────────── */
  {
    name: 'Lifelong Elliptical Cross Trainer',
    short_description: '5kg flywheel, LCD display, 8 resistance levels',
    description: 'Home gym elliptical with 5kg flywheel, 8 magnetic resistance levels, and LCD display showing time, speed, distance, and calories.',
    category: 'sports', brand: 'Lifelong',
    price: 12999, mrp: 18999, stock: 15,
    is_featured: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
    specifications: { Flywheel: '5kg', Resistance: '8 levels', Display: 'LCD', 'Max User Weight': '100kg', 'Stride Length': '40cm' },
  },
  {
    name: 'Adidas Football Size 5',
    short_description: 'FIFA quality, thermally bonded panels',
    description: 'Official size and weight football with thermally bonded panels for accurate trajectory and consistent feel.',
    category: 'sports', brand: 'Adidas',
    price: 2499, mrp: 3499, stock: 80,
    is_trending: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400&q=80',
    specifications: { Size: '5', Material: 'PU', Panels: '32', Bladder: 'Butyl', FIFA: 'Quality Pro' },
  },
  {
    name: 'Yoga Mat Premium 6mm',
    short_description: 'Non-slip, eco-friendly TPE, carrying strap',
    description: 'Premium 6mm thick yoga mat made of eco-friendly TPE with double-sided non-slip surface and alignment lines.',
    category: 'sports', brand: 'Lifelong',
    price: 899, mrp: 1499, stock: 150,
    is_featured: true, is_trending: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80',
    specifications: { Thickness: '6mm', Material: 'TPE', Dimensions: '183 x 61 cm', Weight: '1.1kg', 'Non-slip': 'Double-sided' },
  },

  /* ── HEALTH ──────────────────────────── */
  {
    name: 'Himalaya Neem Face Wash 150ml',
    short_description: 'Purifying neem & turmeric formula',
    description: 'Himalaya Purifying Neem Face Wash combines the natural healing properties of Neem and Turmeric to give you clean, clear skin.',
    category: 'health', brand: 'Himalaya',
    price: 169, mrp: 200, stock: 300,
    is_featured: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
    specifications: { Volume: '150ml', 'Skin Type': 'All', Key: 'Neem + Turmeric', 'Cruelty Free': 'Yes' },
  },
  {
    name: 'Philips Beard Trimmer BT3231',
    short_description: '20 settings, self-sharpening blades, 60min runtime',
    description: 'Philips trimmer with 20 length settings (0.5–10mm), self-sharpening steel blades, and 60-minute cordless use on full charge.',
    category: 'health', brand: 'Philips',
    price: 1499, mrp: 2295, stock: 90,
    is_featured: true, is_trending: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1621607512022-6aecc4fed814?w=400&q=80',
    specifications: { Settings: '20', Range: '0.5–10mm', Runtime: '60 min', Charge: '1 hr', Warranty: '2 years' },
  },
  {
    name: 'Omron HEM-7120 Blood Pressure Monitor',
    short_description: 'Clinically validated, irregular heartbeat detection',
    description: 'Omron HEM-7120 automatic upper arm blood pressure monitor with Intellisense technology and irregular heartbeat detection.',
    category: 'health', brand: 'Philips',
    price: 2499, mrp: 3500, stock: 45,
    is_featured: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80',
    specifications: { Type: 'Upper Arm', Memory: '60 readings', Display: 'Digital LCD', 'IHB Detection': 'Yes', Warranty: '5 years' },
  },

  /* ── APPLIANCES ──────────────────────── */
  {
    name: 'LG 260L Frost Free Refrigerator',
    short_description: 'Smart Inverter, Door Cooling+, 3-star rated',
    description: 'LG 260-litre 3 Star Double Door Frost-free refrigerator with Smart Inverter Compressor, Multi Air Flow, and Door Cooling+ technology.',
    category: 'appliances', brand: 'LG',
    price: 28990, mrp: 36990, stock: 10,
    is_featured: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&q=80',
    specifications: { Capacity: '260 litres', Type: 'Double Door', Rating: '3 Star', Compressor: 'Smart Inverter', Warranty: '1yr product + 10yr compressor' },
  },
  {
    name: 'Prestige Iris 750W Mixer Grinder',
    short_description: '3 jars, stainless steel blades, 5-year warranty',
    description: 'Prestige Iris mixer grinder with 750W motor, 3 stainless steel jars, and unique induction motor for quiet, efficient operation.',
    category: 'appliances', brand: 'Prestige',
    price: 2799, mrp: 4295, stock: 55,
    is_featured: true, is_trending: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80',
    specifications: { Power: '750W', Jars: '3 SS jars', Speed: '3 speeds + pulse', Warranty: '5 years', Weight: '4.5kg' },
  },
  {
    name: 'Philips Air Fryer HD9252',
    short_description: 'Rapid Air tech, 1400W, 4.1L capacity',
    description: 'Philips Essential Airfryer uses Rapid Air technology to fry, bake, grill, and roast with 90% less fat. 4.1L capacity feeds a family.',
    category: 'appliances', brand: 'Philips',
    price: 7995, mrp: 12995, stock: 35,
    is_trending: true,
    thumbnail_url: 'https://images.unsplash.com/photo-1648379842776-60c75543dce1?w=400&q=80',
    specifications: { Power: '1400W', Capacity: '4.1L', Technology: 'Rapid Air', 'Fat Reduction': '90%', Timer: '60 min', Warranty: '2 years' },
  },
];

// ── Helper: build slug ──────────────────────────────────────
const makeSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
  '-' + Date.now().toString(36);

async function seed() {
  console.log('🌱 Starting ShopKart Supabase seeder...\n');

  try {
    // Fetch categories and brands maps
    const { data: cats,   error: catErr }   = await supabaseAdmin.from('categories').select('id, slug');
    const { data: brands, error: brandErr } = await supabaseAdmin.from('brands').select('id, name');

    if (catErr)   throw catErr;
    if (brandErr) throw brandErr;

    const catMap   = Object.fromEntries((cats   || []).map(c => [c.slug, c.id]));
    const brandMap = Object.fromEntries((brands || []).map(b => [b.name, b.id]));

    let inserted = 0;
    let skipped  = 0;

    for (const p of products) {
      // Check for duplicate
      const { data: exists } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('name', p.name)
        .limit(1);

      if (exists?.length) { skipped++; continue; }

      const catId   = catMap[p.category];
      const brandId = brandMap[p.brand] || null;

      if (!catId) {
        console.warn(`⚠️  Category '${p.category}' not found for: ${p.name}`);
        continue;
      }

      const slug = makeSlug(p.name);
      const sku  = 'SKU-' + Date.now().toString(36).toUpperCase();

      const { data: product, error: insertErr } = await supabaseAdmin
        .from('products')
        .insert({
          name:              p.name,
          slug,
          short_description: p.short_description || null,
          description:       p.description       || null,
          category_id:       catId,
          brand_id:          brandId,
          sku,
          price:             p.price,
          mrp:               p.mrp    || null,
          stock:             p.stock,
          thumbnail_url:     p.thumbnail_url || null,
          is_featured:       p.is_featured ? 1 : 0,
          is_trending:       p.is_trending  ? 1 : 0,
          specifications:    p.specifications ? JSON.stringify(p.specifications) : null,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // Insert primary image
      if (p.thumbnail_url) {
        await supabaseAdmin.from('product_images').insert({
          product_id: product.id,
          url:        p.thumbnail_url,
          alt_text:   p.name,
          sort_order: 0,
          is_primary: 1,
        });
      }

      inserted++;
      console.log(`  ✅ ${p.name}`);
      await new Promise(r => setTimeout(r, 30)); // avoid slug collision on rapid inserts
    }

    console.log(`\n✨ Seeding complete!`);
    console.log(`   Inserted: ${inserted} products`);
    console.log(`   Skipped:  ${skipped} (already exist)`);

    // Summary counts
    const { count: total }    = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true });
    const { count: featured } = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('is_featured', 1);
    const { count: trending } = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('is_trending', 1);

    console.log(`\n📊 Supabase database now has:`);
    console.log(`   Total products:    ${total}`);
    console.log(`   Featured:          ${featured}`);
    console.log(`   Trending:          ${trending}`);
  } catch (err) {
    console.error('❌ Seeder failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
