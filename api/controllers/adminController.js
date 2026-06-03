const { supabaseAdmin } = require('../config/supabase');

// ── GET /api/admin/dashboard ──────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    // Total revenue (non-cancelled orders)
    const { data: revenueOrders } = await supabaseAdmin
      .from('orders')
      .select('total_amount, status')
      .neq('status', 'cancelled');
    const totalRevenue = (revenueOrders || []).reduce((s, o) => s + (o.total_amount || 0), 0);

    // Counts
    const { count: ordersCount }   = await supabaseAdmin.from('orders').select('*', { count: 'exact', head: true });
    const { count: productsCount } = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('is_active', 1);
    const { count: usersCount }    = await supabaseAdmin.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'user');
    const { count: pendingCount }  = await supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending');

    // Revenue chart: last 6 months grouped by month (JS aggregation)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const { data: chartOrders } = await supabaseAdmin
      .from('orders')
      .select('total_amount, created_at')
      .neq('status', 'cancelled')
      .gte('created_at', sixMonthsAgo.toISOString());

    const monthMap = {};
    for (const o of chartOrders || []) {
      const d   = new Date(o.created_at);
      const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (!monthMap[key]) monthMap[key] = { month: key, revenue: 0, orders: 0, _ts: d.getTime() };
      monthMap[key].revenue += o.total_amount || 0;
      monthMap[key].orders  += 1;
    }
    const revenueChart = Object.values(monthMap)
      .sort((a, b) => a._ts - b._ts)
      .map(({ _ts, ...rest }) => ({ ...rest, revenue: +rest.revenue.toFixed(2) }));

    // Top products by units sold
    const { data: orderItemsAll } = await supabaseAdmin
      .from('order_items')
      .select('product_id, product_name, thumbnail_url, quantity, subtotal');

    const productMap = {};
    for (const oi of orderItemsAll || []) {
      if (!productMap[oi.product_id]) {
        productMap[oi.product_id] = { name: oi.product_name, thumbnail_url: oi.thumbnail_url, sold: 0, revenue: 0 };
      }
      productMap[oi.product_id].sold    += oi.quantity;
      productMap[oi.product_id].revenue += oi.subtotal;
    }
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5)
      .map(p => ({ ...p, revenue: +p.revenue.toFixed(2) }));

    // Recent orders with user names
    const { data: recentOrders } = await supabaseAdmin
      .from('orders')
      .select(`
        id, order_number, status, total_amount, created_at,
        user_profiles!inner(name, phone)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    const recentFormatted = (recentOrders || []).map(o => ({
      id:           o.id,
      order_number: o.order_number,
      status:       o.status,
      total:        o.total_amount,
      created_at:   o.created_at,
      user_name:    o.user_profiles?.name,
      phone:        o.user_profiles?.phone,
    }));

    // Category stats
    const { data: categories } = await supabaseAdmin
      .from('categories')
      .select('id, name');
    const { data: products }   = await supabaseAdmin
      .from('products')
      .select('category_id')
      .eq('is_active', 1);

    const catMap = {};
    for (const p of products || []) {
      catMap[p.category_id] = (catMap[p.category_id] || 0) + 1;
    }
    const categoryStats = (categories || []).map(c => ({
      name:     c.name,
      products: catMap[c.id] || 0,
    })).sort((a, b) => b.products - a.products);

    res.json({
      success: true,
      data: {
        stats: {
          revenue:       +totalRevenue.toFixed(2),
          orders:        ordersCount  || 0,
          products:      productsCount || 0,
          users:         usersCount   || 0,
          pendingOrders: pendingCount || 0,
        },
        revenueChart,
        topProducts,
        recentOrders: recentFormatted,
        categoryStats,
      },
    });
  } catch (err) {
    console.error('getDashboard:', err);
    res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
};

// ── GET /api/admin/orders ─────────────────────────────────
exports.getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        user_profiles!inner(name, phone),
        order_items(id)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (status) query = query.eq('status', status);

    const { data: orders, error } = await query;
    if (error) throw error;

    const formatted = (orders || []).map(o => ({
      ...o,
      user_name:  o.user_profiles?.name,
      phone:      o.user_profiles?.phone,
      item_count: o.order_items?.length || 0,
      user_profiles: undefined,
      order_items:   undefined,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
};

// ── PATCH /api/admin/orders/:id/status ───────────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });

    const updates = { status };
    if (status === 'delivered') updates.delivered_at = new Date().toISOString();

    const { error } = await supabaseAdmin.from('orders').update(updates).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Order status updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
};

// ── GET /api/admin/users ──────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('user_profiles')
      .select('id, name, email, phone, role, is_active, is_verified, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error } = await query;
    if (error) throw error;
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

// ── PATCH /api/admin/users/:id ────────────────────────────
exports.updateUser = async (req, res) => {
  try {
    const { is_active, role } = req.body;
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({ is_active, role })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'User updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
};

// ── GET /api/admin/products ───────────────────────────────
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { data: rows, count, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        categories(name),
        brands(name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    const formatted = (rows || []).map(p => ({
      ...p,
      category_name: p.categories?.name,
      brand_name:    p.brands?.name,
      categories:    undefined,
      brands:        undefined,
    }));

    res.json({ success: true, data: formatted, total: count || 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
};

// ── GET /api/admin/stock-alerts ───────────────────────────
exports.getStockAlerts = async (req, res) => {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('products')
      .select(`
        id, name, stock, min_stock_alert,
        categories(name)
      `)
      .eq('is_active', 1)
      .order('stock', { ascending: true })
      .limit(20);

    if (error) throw error;

    // Filter where stock <= min_stock_alert in JS (Supabase doesn't support column comparison in filter directly)
    const alerts = (rows || [])
      .filter(p => p.stock <= p.min_stock_alert)
      .map(p => ({ ...p, category: p.categories?.name, categories: undefined }));

    res.json({ success: true, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch alerts.' });
  }
};
