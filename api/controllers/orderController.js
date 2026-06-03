const { supabaseAdmin } = require('../config/supabase');
const { sendOrderConfirmation, sendOrderCancellation } = require('../utils/mailer');

const genOrderNumber = () =>
  'SK' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();

// ── POST /api/orders ──────────────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const { address_id, payment_method = 'cod' } = req.body;
    if (!address_id) return res.status(400).json({ success: false, message: 'Delivery address required.' });

    // Fetch cart items with product info
    const { data: cartItems, error: cartErr } = await supabaseAdmin
      .from('cart_items')
      .select(`
        quantity,
        products!inner(id, name, sku, thumbnail_url, price, mrp, stock)
      `)
      .eq('user_id', req.user.id);

    if (cartErr) throw cartErr;
    if (!cartItems?.length) return res.status(400).json({ success: false, message: 'Cart is empty.' });

    // Validate stock
    for (const ci of cartItems) {
      if (ci.products.stock < ci.quantity) {
        return res.status(400).json({ success: false, message: `${ci.products.name} has insufficient stock.` });
      }
    }

    // Fetch shipping address
    const { data: address, error: addrErr } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('id', address_id)
      .eq('user_id', req.user.id)
      .single();

    if (addrErr || !address) return res.status(400).json({ success: false, message: 'Address not found.' });

    // Calculate totals
    const subtotal = cartItems.reduce((s, ci) => s + ci.products.price * ci.quantity, 0);
    const shipping = subtotal > 499 ? 0 : 49;
    const tax      = +(subtotal * 0.18).toFixed(2);
    const total    = +(subtotal + shipping + tax).toFixed(2);
    const delivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Create order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id:      req.user.id,
        order_number: genOrderNumber(),
        status:       'pending',
        subtotal,
        shipping_amount:       shipping,
        tax_amount:            tax,
        total_amount:          total,
        shipping_full_name:    address.full_name,
        shipping_phone:        address.phone,
        shipping_address_line1: address.address_line1,
        shipping_address_line2: address.address_line2 || null,
        shipping_city:         address.city,
        shipping_state:        address.state,
        shipping_postal_code:  address.postal_code,
        shipping_country:      address.country || 'India',
        payment_method,
        payment_status:        'pending',
        estimated_delivery:    delivery,
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    // Insert order items & decrement stock
    for (const ci of cartItems) {
      const { error: itemErr } = await supabaseAdmin.from('order_items').insert({
        order_id:     order.id,
        product_id:   ci.products.id,
        product_name: ci.products.name,
        product_sku:  ci.products.sku || null,
        thumbnail_url: ci.products.thumbnail_url || null,
        quantity:     ci.quantity,
        unit_price:   ci.products.price,
        mrp:          ci.products.mrp || null,
        subtotal:     +(ci.products.price * ci.quantity).toFixed(2),
      });
      if (itemErr) throw itemErr;

      // Decrement stock
      await supabaseAdmin
        .from('products')
        .update({ stock: ci.products.stock - ci.quantity })
        .eq('id', ci.products.id);
    }

    // Clear cart
    await supabaseAdmin.from('cart_items').delete().eq('user_id', req.user.id);

    // Send order confirmation email (non-blocking)
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('name, email')
      .eq('id', req.user.id)
      .single();

    sendOrderConfirmation({
      to:    userProfile?.email,
      name:  userProfile?.name,
      order,
      items: cartItems.map(ci => ({
        product_name: ci.products.name,
        quantity:     ci.quantity,
        subtotal:     +(ci.products.price * ci.quantity).toFixed(2),
      })),
    }).catch(err => console.error('Order confirmation email failed:', err));

    res.status(201).json({ success: true, message: 'Order placed!', data: order });
  } catch (err) {
    console.error('createOrder:', err);
    res.status(500).json({ success: false, message: 'Failed to place order.' });
  }
};

// ── GET /api/orders ───────────────────────────────────────
exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items(product_name, quantity)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    // Aggregate totals
    const enriched = (orders || []).map(o => ({
      ...o,
      product_names: o.order_items?.map(i => i.product_name).join(', ') || '',
      total_items:   o.order_items?.reduce((s, i) => s + i.quantity, 0) || 0,
      order_items:   undefined,
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
};

// ── GET /api/orders/:id ───────────────────────────────────
exports.getOrder = async (req, res) => {
  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const { order_items: items, ...orderData } = order;
    res.json({ success: true, data: { ...orderData, items } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch order.' });
  }
};

// ── PATCH /api/orders/:id/cancel ─────────────────────────
exports.cancelOrder = async (req, res) => {
  try {
    // Fetch order
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .in('status', ['pending', 'confirmed'])
      .single();

    if (error || !order) return res.status(400).json({ success: false, message: 'Cannot cancel this order.' });

    // Cancel it
    await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancel_reason: req.body.reason || 'User cancelled' })
      .eq('id', req.params.id);

    // Restore stock
    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', req.params.id);

    for (const item of items || []) {
      const { data: prod } = await supabaseAdmin
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();
      if (prod) {
        await supabaseAdmin
          .from('products')
          .update({ stock: prod.stock + item.quantity })
          .eq('id', item.product_id);
      }
    }

    // Send cancellation email (non-blocking)
    const { data: fullOrder } = await supabaseAdmin
      .from('orders')
      .select('order_number, total_amount')
      .eq('id', req.params.id)
      .single();

    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('name, email')
      .eq('id', req.user.id)
      .single();

    sendOrderCancellation({
      to:     userProfile?.email,
      name:   userProfile?.name,
      order:  fullOrder,
      reason: req.body.reason || null,
    }).catch(err => console.error('Cancellation email failed:', err));

    res.json({ success: true, message: 'Order cancelled.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Cancel failed.' });
  }
};
