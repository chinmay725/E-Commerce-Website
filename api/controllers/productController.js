const { supabase } = require('../config/supabase');
const slugify = require('slugify');

const makeSlug = (name) =>
  slugify(name, { lower: true, strict: true }) + '-' + Date.now().toString(36);

// ── GET /api/products ─────────────────────────────────────
exports.getProducts = async (req, res) => {
  try {
    const {
      category, brand, search, minPrice, maxPrice,
      sort = 'created_at', order = 'DESC',
      page = 1, limit = 20, featured, trending,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = supabase
      .from('products')
      .select(`
        id, name, slug, price, mrp, stock,
        thumbnail_url, avg_rating, review_count,
        is_featured, is_trending, short_description,
        categories!inner(name, slug),
        brands(name)
      `, { count: 'exact' })
      .eq('is_active', 1);

    if (category) query = query.eq('categories.slug', category);
    if (brand) query = query.eq('brands.name', brand);
    if (minPrice) query = query.gte('price', parseFloat(minPrice));
    if (maxPrice) query = query.lte('price', parseFloat(maxPrice));
    if (featured) query = query.eq('is_featured', 1);
    if (trending) query = query.eq('is_trending', 1);
    if (search) query = query.ilike('name', `%${search}%`);

    const allowedSort = { price: 'price', rating: 'avg_rating', name: 'name', newest: 'created_at', popular: 'review_count' };
    const sortCol = allowedSort[sort] || 'created_at';
    const sortDir = order.toUpperCase() === 'ASC' ? true : false;

    query = query.order(sortCol, { ascending: sortDir });
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data: products, count, error } = await query;

    if (error) throw error;

    // Transform data to match expected format
    const transformedProducts = products.map(p => ({
      ...p,
      category_name: p.categories?.name,
      category_slug: p.categories?.slug,
      brand_name: p.brands?.name,
    }));

    res.json({
      success: true,
      data: transformedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / parseInt(limit)),
        hasNext: parseInt(page) < Math.ceil((count || 0) / parseInt(limit)),
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (err) {
    console.error('getProducts:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
};

// ── GET /api/products/:slug ───────────────────────────────
exports.getProduct = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        categories!inner(name, slug),
        brands(name)
      `)
      .eq('slug', slug)
      .eq('is_active', 1)
      .single();

    if (error || !product) return res.status(404).json({ success: false, message: 'Product not found.' });

    // Get images
    const { data: images } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', product.id)
      .order('sort_order');

    // Get reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select(`
        *,
        user_profiles(name, avatar_url)
      `)
      .eq('product_id', product.id)
      .eq('is_approved', 1)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get similar products
    const { data: similar } = await supabase
      .from('products')
      .select('id, name, slug, price, mrp, thumbnail_url, avg_rating')
      .eq('category_id', product.category_id)
      .neq('id', product.id)
      .eq('is_active', 1)
      .limit(8);

    res.json({ success: true, data: { ...product, images, reviews, similar } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch product.' });
  }
};

// ── POST /api/products  (admin) ────────────────────────────
exports.createProduct = async (req, res) => {
  try {
    const {
      name, description, short_description, category_id, brand_id,
      price, mrp, cost_price, stock, weight_grams,
      is_featured, is_trending, tags, specifications, images,
    } = req.body;

    if (!name || !price || !category_id) {
      return res.status(400).json({ success: false, message: 'Name, price, and category are required.' });
    }

    const slug = makeSlug(name);
    const sku = `SKU-${Date.now().toString(36).toUpperCase()}`;

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name, slug, description, short_description,
        category_id, brand_id, sku,
        price: parseFloat(price),
        mrp: mrp ? parseFloat(mrp) : null,
        cost_price: cost_price ? parseFloat(cost_price) : null,
        stock: parseInt(stock) || 0,
        weight_grams,
        is_featured: is_featured ? 1 : 0,
        is_trending: is_trending ? 1 : 0,
        tags,
        specifications
      })
      .select()
      .single();

    if (error) throw error;

    // Insert images
    if (images?.length) {
      for (let i = 0; i < images.length; i++) {
        await supabase.from('product_images').insert({
          product_id: product.id,
          url: images[i].url,
          alt_text: images[i].alt || name,
          sort_order: i,
          is_primary: i === 0 ? 1 : 0
        });
      }
      // Set thumbnail
      await supabase
        .from('products')
        .update({ thumbnail_url: images[0].url })
        .eq('id', product.id);
    }

    res.status(201).json({ success: true, message: 'Product created.', productId: product.id, slug });
  } catch (err) {
    console.error('createProduct:', err);
    res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
};

// ── PUT /api/products/:id  (admin) ────────────────────────
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;

    const allowed = [
      'name','description','short_description','category_id','brand_id',
      'price','mrp','cost_price','stock','weight_grams',
      'is_featured','is_trending','tags','specifications','is_active',
    ];

    const sets  = [];
    const vals  = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = ?`);
        vals.push(['tags','specifications'].includes(key) ? JSON.stringify(fields[key]) : fields[key]);
      }
    }

    if (!sets.length) return res.status(400).json({ success: false, message: 'No valid fields to update.' });

    vals.push(id);
    await pool.execute(`UPDATE products SET ${sets.join(',')} WHERE id = ?`, vals);
    res.json({ success: true, message: 'Product updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
};

// ── DELETE /api/products/:id  (admin) ─────────────────────
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
    res.json({ success: true, message: 'Product deleted (soft).' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
};

// ── GET /api/products/search/suggestions ──────────────────
exports.searchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, data: [] });

    const [rows] = await pool.execute(
      `SELECT id, name, slug, thumbnail_url, price FROM products
       WHERE name LIKE ? AND is_active = 1 LIMIT 8`,
      [`%${q}%`]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Search failed.' });
  }
};
