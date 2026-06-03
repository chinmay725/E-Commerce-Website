const express           = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { protect }       = require('../middleware/auth');

// ── routes/cart.js ────────────────────────────────────────
const cartRouter = express.Router();
const cartCtrl   = require('../controllers/cartController');

cartRouter.use(protect);
cartRouter.get   ('/',    cartCtrl.getCart);
cartRouter.post  ('/',    cartCtrl.addToCart);
cartRouter.patch ('/:id', cartCtrl.updateCart);
cartRouter.delete('/:id', cartCtrl.removeFromCart);
cartRouter.delete('/',    cartCtrl.clearCart);

// ── routes/orders.js ──────────────────────────────────────
const orderRouter = express.Router();
const orderCtrl   = require('../controllers/orderController');

orderRouter.use(protect);
orderRouter.post ('/',            orderCtrl.createOrder);
orderRouter.get  ('/',            orderCtrl.getOrders);
orderRouter.get  ('/:id',         orderCtrl.getOrder);
orderRouter.patch('/:id/cancel',  orderCtrl.cancelOrder);

// ── routes/categories.js ──────────────────────────────────
const catRouter = express.Router();

catRouter.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_active', 1)
      .order('sort_order');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
});

catRouter.get('/:slug', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('slug', req.params.slug)
      .single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed.' });
  }
});

// ── routes/admin.js ───────────────────────────────────────
const adminRouter = express.Router();
const adminCtrl   = require('../controllers/adminController');
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
    if (!product_id || !rating) {
      return res.status(400).json({ success: false, message: 'product_id and rating required.' });
    }

    const { error } = await supabaseAdmin
      .from('reviews')
      .upsert(
        { product_id, user_id: req.user.id, rating, title: title || null, body: body || null },
        { onConflict: 'product_id,user_id' }
      );
    if (error) throw error;
    res.json({ success: true, message: 'Review submitted.' });
  } catch (e) {
    console.error('submitReview:', e);
    res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
});

reviewRouter.get('/product/:id', async (req, res) => {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('reviews')
      .select(`
        *,
        user_profiles(name, avatar_url)
      `)
      .eq('product_id', req.params.id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const formatted = (rows || []).map(r => ({
      ...r,
      user_name:  r.user_profiles?.name,
      avatar_url: r.user_profiles?.avatar_url,
      user_profiles: undefined,
    }));
    res.json({ success: true, data: formatted });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
  }
});

// ── routes/users.js ───────────────────────────────────────
const userRouter = express.Router();
userRouter.use(protect);

// Wishlist
userRouter.get('/wishlist', async (req, res) => {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('wishlist_items')
      .select(`
        id, created_at,
        products!inner(id, name, slug, price, mrp, thumbnail_url, avg_rating)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const flat = (rows || []).map(w => ({
      id:            w.id,
      added_at:      w.created_at,
      product_id:    w.products.id,
      name:          w.products.name,
      slug:          w.products.slug,
      price:         w.products.price,
      mrp:           w.products.mrp,
      thumbnail_url: w.products.thumbnail_url,
      avg_rating:    w.products.avg_rating,
    }));
    res.json({ success: true, data: flat });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch wishlist.' });
  }
});

userRouter.post('/wishlist', async (req, res) => {
  try {
    const { product_id } = req.body;
    const { error } = await supabaseAdmin
      .from('wishlist_items')
      .upsert({ user_id: req.user.id, product_id }, { onConflict: 'user_id,product_id', ignoreDuplicates: true });
    if (error) throw error;
    res.json({ success: true, message: 'Added to wishlist.' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to add to wishlist.' });
  }
});

userRouter.delete('/wishlist/:product_id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('wishlist_items')
      .delete()
      .eq('user_id', req.user.id)
      .eq('product_id', req.params.product_id);
    if (error) throw error;
    res.json({ success: true, message: 'Removed from wishlist.' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to remove from wishlist.' });
  }
});

// Addresses
userRouter.get('/addresses', async (req, res) => {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('user_id', req.user.id)
      .order('is_default', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch addresses.' });
  }
});

userRouter.post('/addresses', async (req, res) => {
  try {
    const { label, full_name, phone, line1, line2, city, state, pincode, is_default } = req.body;

    if (is_default) {
      await supabaseAdmin.from('addresses').update({ is_default: 0 }).eq('user_id', req.user.id);
    }

    const { error } = await supabaseAdmin.from('addresses').insert({
      user_id:       req.user.id,
      label:         label || 'Home',
      full_name,
      phone,
      address_line1: line1,
      address_line2: line2 || null,
      city,
      state,
      postal_code:   pincode,
      is_default:    is_default ? 1 : 0,
    });
    if (error) throw error;
    res.json({ success: true, message: 'Address saved.' });
  } catch (e) {
    console.error('addAddress:', e);
    res.status(500).json({ success: false, message: 'Failed to save address.' });
  }
});

userRouter.delete('/addresses/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('addresses')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ success: true, message: 'Address deleted.' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete address.' });
  }
});

module.exports = { cartRouter, orderRouter, catRouter, adminRouter, reviewRouter, userRouter };
