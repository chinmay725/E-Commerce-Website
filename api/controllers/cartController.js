const { supabaseAdmin } = require('../config/supabase');

// ── GET /api/cart ─────────────────────────────────────────
exports.getCart = async (req, res) => {
  try {
    const { data: items, error } = await supabaseAdmin
      .from('cart_items')
      .select(`
        id, quantity, created_at,
        products!inner(
          id, name, slug, price, mrp, thumbnail_url, stock, is_active
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Flatten product fields
    const flat = (items || []).map(ci => ({
      id:            ci.id,
      quantity:      ci.quantity,
      added_at:      ci.created_at,
      product_id:    ci.products.id,
      name:          ci.products.name,
      slug:          ci.products.slug,
      price:         ci.products.price,
      mrp:           ci.products.mrp,
      thumbnail_url: ci.products.thumbnail_url,
      stock:         ci.products.stock,
      is_active:     ci.products.is_active,
    }));

    const subtotal = flat.reduce((s, i) => s + i.price * i.quantity, 0);
    const savings  = flat.reduce((s, i) => s + ((i.mrp || i.price) - i.price) * i.quantity, 0);
    const shipping = subtotal > 499 ? 0 : 49;
    const total    = subtotal + shipping;

    res.json({
      success: true,
      data: { items: flat, subtotal, savings, shipping, total, itemCount: flat.length },
    });
  } catch (err) {
    console.error('getCart:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch cart.' });
  }
};

// ── POST /api/cart ────────────────────────────────────────
exports.addToCart = async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    if (!product_id) return res.status(400).json({ success: false, message: 'product_id required.' });

    // Validate product
    const { data: product, error: pErr } = await supabaseAdmin
      .from('products')
      .select('id, stock')
      .eq('id', product_id)
      .eq('is_active', 1)
      .single();

    if (pErr || !product) return res.status(404).json({ success: false, message: 'Product not found.' });
    if (product.stock < 1)  return res.status(400).json({ success: false, message: 'Out of stock.' });

    // Check existing cart item
    const { data: existing } = await supabaseAdmin
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', req.user.id)
      .eq('product_id', product_id)
      .single();

    if (existing) {
      const newQty = Math.min(existing.quantity + parseInt(quantity), product.stock);
      await supabaseAdmin.from('cart_items').update({ quantity: newQty }).eq('id', existing.id);
    } else {
      await supabaseAdmin.from('cart_items').insert({
        user_id:    req.user.id,
        product_id,
        quantity:   Math.min(parseInt(quantity), product.stock),
      });
    }

    res.json({ success: true, message: 'Added to cart.' });
  } catch (err) {
    console.error('addToCart:', err);
    res.status(500).json({ success: false, message: 'Failed to add to cart.' });
  }
};

// ── PATCH /api/cart/:id ───────────────────────────────────
exports.updateCart = async (req, res) => {
  try {
    const { id }       = req.params;
    const { quantity } = req.body;

    if (parseInt(quantity) < 1) {
      await supabaseAdmin.from('cart_items').delete().eq('id', id).eq('user_id', req.user.id);
      return res.json({ success: true, message: 'Item removed.' });
    }

    const { error } = await supabaseAdmin
      .from('cart_items')
      .update({ quantity: parseInt(quantity) })
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true, message: 'Cart updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update cart.' });
  }
};

// ── DELETE /api/cart/:id ──────────────────────────────────
exports.removeFromCart = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true, message: 'Item removed from cart.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove item.' });
  }
};

// ── DELETE /api/cart ──────────────────────────────────────
exports.clearCart = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to clear cart.' });
  }
};
