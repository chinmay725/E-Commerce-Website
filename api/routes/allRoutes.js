// ── routes/cart.js ────────────────────────────────────────
const express = require('express');
const cartRouter = express.Router();
const cartCtrl = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

cartRouter.use(protect);
cartRouter.get   ('/',    cartCtrl.getCart);
cartRouter.post  ('/',    cartCtrl.addToCart);
cartRouter.patch ('/:id', cartCtrl.updateCart);
cartRouter.delete('/:id', cartCtrl.removeFromCart);
cartRouter.delete('/',    cartCtrl.clearCart);

// ── routes/orders.js ──────────────────────────────────────
const orderRouter = express.Router();
const orderCtrl = require('../controllers/orderController');

orderRouter.use(protect);
orderRouter.post ('/',              orderCtrl.createOrder);
orderRouter.get  ('/',              orderCtrl.getOrders);
orderRouter.get  ('/:id',          orderCtrl.getOrder);
orderRouter.patch('/:id/cancel',   orderCtrl.cancelOrder);

// ── routes/categories.js ──────────────────────────────────
const catRouter = express.Router();
const { supabase } = require('../config/supabase');

catRouter.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', 1)
      .order('sort_order');
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

catRouter.get('/:slug', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', req.params.slug)
      .single();
    
    if (error || !data) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

// ── routes/admin.js ───────────────────────────────────────
const adminRouter = express.Router();
const adminCtrl = require('../controllers/adminController');
const { adminOnly } = require('../middleware/auth');

adminRouter.use(protect, adminOnly);
adminRouter.get ('/dashboard',          adminCtrl.getDashboard);
adminRouter.get ('/orders',             adminCtrl.getOrders);
adminRouter.patch('/orders/:id/status', adminCtrl.updateOrderStatus);
adminRouter.get ('/users',              adminCtrl.getUsers);
adminRouter.patch('/users/:id',         adminCtrl.updateUser);
adminRouter.get ('/products',           adminCtrl.getProducts);
adminRouter.get ('/stock-alerts',       adminCtrl.getStockAlerts);

// ── routes/reviews.js ─────────────────────────────────────
const reviewRouter = express.Router();

reviewRouter.post('/', protect, async (req, res) => {
  try {
    const { product_id, rating, title, body } = req.body;
    if (!product_id || !rating) return res.status(400).json({ success: false, message: 'product_id and rating required.' });
    await pool.execute(
      'INSERT INTO reviews (product_id,user_id,rating,title,body) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE rating=VALUES(rating),title=VALUES(title),body=VALUES(body)',
      [product_id, req.user.id, rating, title||null, body||null]
    );
    res.json({ success: true, message: 'Review submitted.' });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to submit review.' }); }
});

reviewRouter.get('/product/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, u.name AS user_name FROM reviews r JOIN users u ON r.user_id=u.id WHERE r.product_id=? ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

// ── routes/users.js ───────────────────────────────────────
const userRouter = express.Router();

userRouter.use(protect);

// Wishlist
userRouter.get('/wishlist', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT w.id, w.added_at, p.id AS product_id, p.name, p.slug, p.price, p.mrp, p.thumbnail_url, p.avg_rating
       FROM wishlist_items w JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ? ORDER BY w.added_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

userRouter.post('/wishlist', async (req, res) => {
  try {
    const { product_id } = req.body;
    await pool.execute(
      'INSERT IGNORE INTO wishlist_items (user_id, product_id) VALUES (?,?)',
      [req.user.id, product_id]
    );
    res.json({ success: true, message: 'Added to wishlist.' });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

userRouter.delete('/wishlist/:product_id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM wishlist_items WHERE user_id=? AND product_id=?', [req.user.id, req.params.product_id]);
    res.json({ success: true, message: 'Removed from wishlist.' });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

// Addresses
userRouter.get('/addresses', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC', [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

userRouter.post('/addresses', async (req, res) => {
  try {
    const { label, full_name, phone, line1, line2, city, state, pincode, is_default } = req.body;
    if (is_default) {
      await pool.execute('UPDATE addresses SET is_default=0 WHERE user_id=?', [req.user.id]);
    }
    await pool.execute(
      'INSERT INTO addresses (user_id,label,full_name,phone,line1,line2,city,state,pincode,is_default) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [req.user.id, label||'Home', full_name, phone, line1, line2||null, city, state, pincode, is_default?1:0]
    );
    res.json({ success: true, message: 'Address saved.' });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

userRouter.delete('/addresses/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM addresses WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Address deleted.' });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

module.exports = { cartRouter, orderRouter, catRouter, adminRouter, reviewRouter, userRouter };

// ── Re-export fix for server.js ───────────────────────────
// In server.js replace individual requires with:
//   const { cartRouter, orderRouter, catRouter, adminRouter, reviewRouter, userRouter } = require('./routes/allRoutes');
