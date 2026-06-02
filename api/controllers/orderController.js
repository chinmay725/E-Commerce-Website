const pool = require('../config/db');

const genOrderNumber = () =>
  'SK' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,5).toUpperCase();

// ── POST /api/orders ──────────────────────────────────────
exports.createOrder = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { address_id, payment_method = 'cod' } = req.body;
    if (!address_id) return res.status(400).json({ success: false, message: 'Delivery address required.' });

    // Fetch cart
    const [cartItems] = await conn.execute(
      `SELECT ci.quantity, p.id AS product_id, p.name, p.slug AS product_sku,
              p.thumbnail_url, p.price, p.mrp, p.stock
       FROM cart_items ci JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ?`,
      [req.user.id]
    );
    if (!cartItems.length) return res.status(400).json({ success: false, message: 'Cart is empty.' });

    // Validate stock
    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: `${item.name} has insufficient stock.` });
      }
    }

    const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = subtotal > 499 ? 0 : 49;
    const tax      = +(subtotal * 0.18).toFixed(2);
    const total    = +(subtotal + shipping + tax).toFixed(2);

    const delivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [orderResult] = await conn.execute(
      `INSERT INTO orders
       (order_number,user_id,address_id,payment_method,subtotal,shipping_charge,tax,total,estimated_delivery)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [genOrderNumber(), req.user.id, address_id, payment_method, subtotal, shipping, tax, total, delivery]
    );
    const orderId = orderResult.insertId;

    // Insert order items & decrement stock
    for (const item of cartItems) {
      await conn.execute(
        `INSERT INTO order_items (order_id,product_id,product_name,product_sku,thumbnail,quantity,unit_price,mrp,subtotal)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [orderId, item.product_id, item.name, item.product_sku, item.thumbnail_url,
         item.quantity, item.price, item.mrp, +(item.price * item.quantity).toFixed(2)]
      );
      await conn.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    // Clear cart
    await conn.execute('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    await conn.commit();

    const [order] = await conn.execute('SELECT * FROM orders WHERE id = ? LIMIT 1', [orderId]);
    res.status(201).json({ success: true, message: 'Order placed!', data: order[0] });
  } catch (err) {
    await conn.rollback();
    console.error('createOrder:', err);
    res.status(500).json({ success: false, message: 'Failed to place order.' });
  } finally {
    conn.release();
  }
};

// ── GET /api/orders ───────────────────────────────────────
exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [orders] = await pool.execute(
      `SELECT o.*, GROUP_CONCAT(oi.product_name SEPARATOR ', ') AS product_names,
              SUM(oi.quantity) AS total_items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = ?
       GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [req.user.id, parseInt(limit), offset]
    );

    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
};

// ── GET /api/orders/:id ───────────────────────────────────
exports.getOrder = async (req, res) => {
  try {
    const [orders] = await pool.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ? LIMIT 1',
      [req.params.id, req.user.id]
    );
    if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found.' });

    const [items] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [orders[0].id]);
    res.json({ success: true, data: { ...orders[0], items } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch order.' });
  }
};

// ── PATCH /api/orders/:id/cancel ─────────────────────────
exports.cancelOrder = async (req, res) => {
  try {
    const [orders] = await pool.execute(
      "SELECT * FROM orders WHERE id = ? AND user_id = ? AND status IN ('pending','confirmed') LIMIT 1",
      [req.params.id, req.user.id]
    );
    if (!orders.length) return res.status(400).json({ success: false, message: 'Cannot cancel this order.' });

    await pool.execute(
      "UPDATE orders SET status = 'cancelled', cancelled_at = NOW(), cancel_reason = ? WHERE id = ?",
      [req.body.reason || 'User cancelled', req.params.id]
    );

    // Restore stock
    const [items] = await pool.execute('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [req.params.id]);
    for (const item of items) {
      await pool.execute('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    res.json({ success: true, message: 'Order cancelled.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Cancel failed.' });
  }
};
