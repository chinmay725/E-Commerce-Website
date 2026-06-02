const pool = require('../config/db');

// ── GET /api/admin/dashboard ──────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const [[revenue]]  = await pool.execute("SELECT COALESCE(SUM(total),0) AS total FROM orders WHERE status != 'cancelled'");
    const [[orders]]   = await pool.execute("SELECT COUNT(*) AS total FROM orders");
    const [[products]] = await pool.execute("SELECT COUNT(*) AS total FROM products WHERE is_active=1");
    const [[users]]    = await pool.execute("SELECT COUNT(*) AS total FROM users WHERE role='user'");
    const [[pending]]  = await pool.execute("SELECT COUNT(*) AS total FROM orders WHERE status='pending'");

    const [revenueChart] = await pool.execute(
      `SELECT DATE_FORMAT(created_at,'%b %Y') AS month,
              ROUND(SUM(total),2) AS revenue, COUNT(*) AS orders
       FROM orders WHERE created_at > DATE_SUB(NOW(), INTERVAL 6 MONTH)
         AND status != 'cancelled'
       GROUP BY YEAR(created_at), MONTH(created_at)
       ORDER BY MIN(created_at)`
    );

    const [topProducts] = await pool.execute(
      `SELECT p.name, p.thumbnail_url, SUM(oi.quantity) AS sold, SUM(oi.subtotal) AS revenue
       FROM order_items oi JOIN products p ON oi.product_id = p.id
       GROUP BY p.id ORDER BY sold DESC LIMIT 5`
    );

    const [recentOrders] = await pool.execute(
      `SELECT o.id, o.order_number, o.status, o.total, o.created_at,
              u.name AS user_name, u.phone
       FROM orders o JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC LIMIT 10`
    );

    const [categoryStats] = await pool.execute(
      `SELECT c.name, COUNT(p.id) AS products
       FROM categories c LEFT JOIN products p ON c.id = p.category_id AND p.is_active=1
       GROUP BY c.id ORDER BY products DESC`
    );

    res.json({
      success: true,
      data: {
        stats: {
          revenue: +revenue.total,
          orders:  orders.total,
          products: products.total,
          users:   users.total,
          pendingOrders: pending.total,
        },
        revenueChart,
        topProducts,
        recentOrders,
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
    const cond   = status ? 'WHERE o.status = ?' : '';
    const params = status ? [status, parseInt(limit), offset] : [parseInt(limit), offset];

    const [orders] = await pool.execute(
      `SELECT o.*, u.name AS user_name, u.phone,
              COUNT(oi.id) AS item_count
       FROM orders o
       JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       ${cond} GROUP BY o.id
       ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      params
    );
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
};

// ── PATCH /api/admin/orders/:id/status ───────────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending','confirmed','processing','shipped','delivered','cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });

    const extra = status === 'delivered' ? ', delivered_at = NOW()' : '';
    await pool.execute(`UPDATE orders SET status = ?${extra} WHERE id = ?`, [status, req.params.id]);
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
    const cond   = search ? "WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?" : '';
    const params = search
      ? [`%${search}%`, `%${search}%`, `%${search}%`, parseInt(limit), offset]
      : [parseInt(limit), offset];

    const [users] = await pool.execute(
      `SELECT id, name, email, phone, role, is_active, is_verified, created_at
       FROM users ${cond} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      params
    );
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

// ── PATCH /api/admin/users/:id ────────────────────────────
exports.updateUser = async (req, res) => {
  try {
    const { is_active, role } = req.body;
    await pool.execute(
      'UPDATE users SET is_active = ?, role = ? WHERE id = ?',
      [is_active, role, req.params.id]
    );
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
    const [rows] = await pool.execute(
      `SELECT p.*, c.name AS category_name, b.name AS brand_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );
    const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM products');
    res.json({ success: true, data: rows, total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
};

// ── GET /api/admin/stock-alerts ───────────────────────────
exports.getStockAlerts = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.id, p.name, p.stock, p.min_stock_alert, c.name AS category
       FROM products p LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.stock <= p.min_stock_alert AND p.is_active = 1
       ORDER BY p.stock ASC LIMIT 20`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch alerts.' });
  }
};
