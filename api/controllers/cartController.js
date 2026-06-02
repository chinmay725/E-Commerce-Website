const pool = require('../config/db');

// ── GET /api/cart ─────────────────────────────────────────
exports.getCart = async (req, res) => {
  try {
    const [items] = await pool.execute(
      `SELECT ci.id, ci.quantity, ci.added_at,
              p.id AS product_id, p.name, p.slug, p.price, p.mrp,
              p.thumbnail_url, p.stock, p.is_active
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ?
       ORDER BY ci.added_at DESC`,
      [req.user.id]
    );

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const savings  = items.reduce((s, i) => s + ((i.mrp || i.price) - i.price) * i.quantity, 0);
    const shipping = subtotal > 499 ? 0 : 49;
    const total    = subtotal + shipping;

    res.json({
      success: true,
      data: { items, subtotal, savings, shipping, total, itemCount: items.length },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch cart.' });
  }
};

// ── POST /api/cart ────────────────────────────────────────
exports.addToCart = async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    if (!product_id) return res.status(400).json({ success: false, message: 'product_id required.' });

    const [product] = await pool.execute(
      'SELECT id, stock FROM products WHERE id = ? AND is_active = 1 LIMIT 1',
      [product_id]
    );
    if (!product.length) return res.status(404).json({ success: false, message: 'Product not found.' });
    if (product[0].stock < 1) return res.status(400).json({ success: false, message: 'Out of stock.' });

    await pool.execute(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE quantity = LEAST(quantity + VALUES(quantity), ?)`,
      [req.user.id, product_id, parseInt(quantity), product[0].stock]
    );

    res.json({ success: true, message: 'Added to cart.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add to cart.' });
  }
};

// ── PATCH /api/cart/:id ───────────────────────────────────
exports.updateCart = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    if (quantity < 1) {
      await pool.execute('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [id, req.user.id]);
      return res.json({ success: true, message: 'Item removed.' });
    }
    await pool.execute(
      'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
      [parseInt(quantity), id, req.user.id]
    );
    res.json({ success: true, message: 'Cart updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update cart.' });
  }
};

// ── DELETE /api/cart/:id ──────────────────────────────────
exports.removeFromCart = async (req, res) => {
  try {
    await pool.execute('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Item removed from cart.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove item.' });
  }
};

// ── DELETE /api/cart ──────────────────────────────────────
exports.clearCart = async (req, res) => {
  try {
    await pool.execute('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to clear cart.' });
  }
};
