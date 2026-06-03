import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../ctx/CartContext';
import api from '../lib/api';
import { useAuth } from '../ctx/AuthContext';
import toast from 'react-hot-toast';

// ════════════════════════════════════════════════
// CartPage
// ════════════════════════════════════════════════
export function CartPage() {
  const { cart, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  if (!cart.items?.length) return (
    <div className="page-wrapper" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'72vh', flexDirection:'column', gap:16, textAlign:'center', padding:20 }}>
      <motion.div style={{ fontSize:72 }} animate={{ rotate:[0,-10,10,-10,0] }} transition={{ duration:.6 }}>🛒</motion.div>
      <h2>Your cart is empty</h2>
      <p style={{ color:'var(--text-muted)', maxWidth:320 }}>Add some products to get started on your shopping journey.</p>
      <Link to="/products" className="btn btn-primary btn-lg">Browse Products</Link>
    </div>
  );

  return (
    <div className="page-wrapper" style={{ padding:'28px 0 60px', background:'var(--bg-secondary)', minHeight:'100vh' }}>
      <div className="container">
        <h1 style={{ marginBottom:28, fontSize:'clamp(1.3rem,3vw,1.8rem)' }}>
          Shopping Cart <span style={{ fontSize:'0.65em', fontWeight:500, color:'var(--text-muted)' }}>({cart.itemCount} items)</span>
        </h1>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:24, alignItems:'start' }}>
          {/* Items */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <AnimatePresence>
              {cart.items.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity:0, y:12 }}
                  animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, height:0, marginBottom:0 }}
                  style={{ background:'var(--surface)', border:'1px solid var(--border-light)', borderRadius:'var(--r-lg)', padding:20, display:'flex', gap:16 }}
                >
                  <Link to={`/product/${item.slug}`} style={{ flexShrink:0 }}>
                    <img src={item.thumbnail_url || '/placeholder.png'} alt={item.name}
                      style={{ width:100, height:100, objectFit:'cover', borderRadius:'var(--r-md)', border:'1px solid var(--border-light)', background:'var(--bg-secondary)' }} />
                  </Link>
                  <div style={{ flex:1, minWidth:0 }}>
                    <Link to={`/product/${item.slug}`}>
                      <h4 style={{ fontSize:15, fontWeight:600, marginBottom:6, lineHeight:1.4 }}>{item.name}</h4>
                    </Link>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                      <span style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800 }}>₹{item.price?.toLocaleString('en-IN')}</span>
                      {item.mrp > item.price && <span style={{ textDecoration:'line-through', color:'var(--text-muted)', fontSize:13 }}>₹{item.mrp?.toLocaleString('en-IN')}</span>}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                      <div style={{ display:'flex', alignItems:'center', border:'2px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden' }}>
                        <button style={{ width:36, height:36, background:'var(--bg-secondary)', fontWeight:700, fontSize:18, cursor:'pointer', border:'none', transition:'background .12s' }}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}
                          onMouseEnter={e => e.currentTarget.style.background='var(--bg-tertiary)'}
                          onMouseLeave={e => e.currentTarget.style.background='var(--bg-secondary)'}
                        >−</button>
                        <span style={{ minWidth:40, textAlign:'center', fontSize:14, fontWeight:700 }}>{item.quantity}</span>
                        <button style={{ width:36, height:36, background:'var(--bg-secondary)', fontWeight:700, fontSize:18, cursor:'pointer', border:'none', transition:'background .12s' }}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock}
                          onMouseEnter={e => e.currentTarget.style.background='var(--bg-tertiary)'}
                          onMouseLeave={e => e.currentTarget.style.background='var(--bg-secondary)'}
                        >+</button>
                      </div>
                      <button className="btn btn-ghost btn-sm" style={{ color:'var(--danger)' }} onClick={() => removeItem(item.id)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        Remove
                      </button>
                    </div>
                  </div>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:17, flexShrink:0, color:'var(--text-primary)' }}>
                    ₹{(item.price * item.quantity)?.toLocaleString('en-IN')}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <motion.div
            initial={{ opacity:0, y:12 }}
            animate={{ opacity:1, y:0 }}
            style={{ background:'var(--surface)', border:'1px solid var(--border-light)', borderRadius:'var(--r-lg)', padding:24, position:'sticky', top:'calc(var(--navbar-h) + 20px)', boxShadow:'var(--s-sm)' }}
          >
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:20 }}>Order Summary</h3>
            {[
              ['Subtotal', `₹${cart.subtotal?.toLocaleString('en-IN')}`],
              ['Shipping', cart.shipping === 0 ? '🎉 FREE' : `₹${cart.shipping}`],
              ...(cart.savings > 0 ? [['Discount', `−₹${cart.savings?.toLocaleString('en-IN')}`]] : []),
            ].map(([l, v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:12, fontSize:14, color:'var(--text-secondary)' }}>
                <span>{l}</span>
                <span style={{ color: l==='Discount' ? 'var(--success)' : l==='Shipping' && cart.shipping===0 ? 'var(--success)' : 'inherit', fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <div style={{ borderTop:'2px solid var(--border-light)', paddingTop:14, display:'flex', justifyContent:'space-between', marginBottom:20, fontFamily:'var(--font-display)', fontWeight:800, fontSize:19 }}>
              <span>Total</span>
              <span>₹{cart.total?.toLocaleString('en-IN')}</span>
            </div>
            {cart.savings > 0 && (
              <div style={{ background:'var(--success-pale)', color:'var(--success)', border:'1px solid rgba(16,185,129,.2)', fontSize:12, fontWeight:700, padding:'10px 14px', borderRadius:'var(--r)', marginBottom:16, textAlign:'center' }}>
                🎉 You save ₹{cart.savings?.toLocaleString('en-IN')} on this order!
              </div>
            )}
            <button className="btn btn-primary" style={{ width:'100%', minHeight:52, fontSize:15, justifyContent:'center' }} onClick={() => navigate('/checkout')}>
              Checkout →
            </button>
            <Link to="/products" className="btn btn-secondary btn-sm" style={{ width:'100%', justifyContent:'center', marginTop:10, display:'flex' }}>
              Continue Shopping
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// OrdersPage
// ════════════════════════════════════════════════
const STATUS_STYLE = {
  pending:    { bg: 'var(--gold-pale)',    color: 'var(--gold)',    label: '⏳ Pending' },
  confirmed:  { bg: 'var(--info-pale)',    color: 'var(--info)',    label: '✓ Confirmed' },
  processing: { bg: 'var(--accent-pale)',  color: 'var(--accent)',  label: '⚙ Processing' },
  shipped:    { bg: 'var(--accent-pale)',  color: 'var(--accent)',  label: '🚚 Shipped' },
  delivered:  { bg: 'var(--success-pale)', color: 'var(--success)', label: '✅ Delivered' },
  cancelled:  { bg: 'var(--danger-pale)',  color: 'var(--danger)',  label: '✕ Cancelled' },
};

const TRACK_STEPS = ['Order Placed', 'Confirmed', 'Shipped', 'Delivered'];
const STEP_MAP = { pending:0, confirmed:1, processing:1, shipped:2, delivered:3, cancelled:-1 };

export function OrdersPage() {
  const [orders, setOrders]         = React.useState([]);
  const [loading, setLoading]       = React.useState(true);
  const [expanded, setExpanded]     = React.useState(null);
  const [cancelling, setCancelling] = React.useState(null); // order id being cancelled
  const [cancelReason, setCancelReason] = React.useState('');
  const [cancelLoading, setCancelLoading] = React.useState(false);

  const fetchOrders = () => {
    api.get('/orders').then(r => setOrders(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  };

  React.useEffect(() => { fetchOrders(); }, []);

  const handleCancel = async () => {
    if (!cancelling) return;
    setCancelLoading(true);
    try {
      await api.patch(`/orders/${cancelling}/cancel`, { reason: cancelReason || 'User cancelled' });
      toast.success('Order cancelled. A confirmation email has been sent.');
      setCancelling(null);
      setCancelReason('');
      // Refresh orders list
      setLoading(true);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel order.');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ padding:'28px 0 60px', background:'var(--bg-secondary)', minHeight:'100vh' }}>
      <div className="container" style={{ maxWidth:800 }}>
        <h1 style={{ marginBottom:28 }}>My Orders</h1>

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:120, borderRadius:'var(--r-lg)' }} />)}
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign:'center', padding:60, background:'var(--surface)', borderRadius:'var(--r-xl)', border:'1px solid var(--border-light)' }}>
            <div style={{ fontSize:64, marginBottom:16 }}>📦</div>
            <h3 style={{ marginBottom:10 }}>No orders yet</h3>
            <p style={{ color:'var(--text-muted)', marginBottom:24 }}>Your future orders will appear here.</p>
            <Link to="/products" className="btn btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {orders.map((order, idx) => {
              const style = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
              const trackStep = STEP_MAP[order.status] ?? 0;
              const isOpen = expanded === order.id;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity:0, y:14 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ delay: idx * 0.06 }}
                  style={{ background:'var(--surface)', border:'1px solid var(--border-light)', borderRadius:'var(--r-lg)', overflow:'hidden' }}
                >
                  {/* Header */}
                  <div
                    style={{ padding:'18px 22px', cursor:'pointer', display:'flex', flexWrap:'wrap', gap:14, alignItems:'flex-start' }}
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                  >
                    <div style={{ flex:1, minWidth:200 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5, flexWrap:'wrap' }}>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:12, background:'var(--bg-secondary)', padding:'2px 10px', borderRadius:'var(--r-full)', fontWeight:700 }}>
                          #{order.order_number}
                        </span>
                        <span style={{ padding:'3px 12px', borderRadius:'var(--r-full)', background:style.bg, color:style.color, fontSize:11, fontWeight:800 }}>
                          {style.label}
                        </span>
                      </div>
                      <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                      </p>
                      <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.4 }}>{order.product_names}</p>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:18 }}>₹{order.total?.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{order.total_items} items · {order.payment_method?.toUpperCase()}</div>
                      <div style={{ fontSize:12, color:'var(--brand)', fontWeight:600, marginTop:4 }}>{isOpen ? '▲ Less' : '▼ Details'}</div>
                    </div>
                  </div>

                  {/* Expanded */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height:0, opacity:0 }}
                        animate={{ height:'auto', opacity:1 }}
                        exit={{ height:0, opacity:0 }}
                        style={{ overflow:'hidden', borderTop:'1px solid var(--border-light)' }}
                      >
                        <div style={{ padding:'16px 22px 20px' }}>
                          {/* Tracker */}
                          {order.status !== 'cancelled' && (
                            <div style={{ display:'flex', alignItems:'center', marginBottom:18 }}>
                              {TRACK_STEPS.map((s, i) => (
                                <React.Fragment key={s}>
                                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flex: i < TRACK_STEPS.length - 1 ? 'none' : 'none' }}>
                                    <div style={{
                                      width:28, height:28, borderRadius:'50%',
                                      background: i <= trackStep ? 'var(--success)' : 'var(--bg-tertiary)',
                                      border: `2px solid ${i <= trackStep ? 'var(--success)' : 'var(--border)'}`,
                                      display:'flex', alignItems:'center', justifyContent:'center',
                                      fontSize:12, fontWeight:800, color: i <= trackStep ? 'white' : 'var(--text-muted)',
                                    }}>
                                      {i < trackStep ? '✓' : i + 1}
                                    </div>
                                    <span style={{ fontSize:10, fontWeight:600, color: i <= trackStep ? 'var(--success)' : 'var(--text-muted)', whiteSpace:'nowrap' }}>{s}</span>
                                  </div>
                                  {i < TRACK_STEPS.length - 1 && (
                                    <div style={{ flex:1, height:2, background: i < trackStep ? 'var(--success)' : 'var(--border)', margin:'0 4px', marginBottom:16 }} />
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                          <p style={{ fontSize:12, color:'var(--text-muted)' }}>Payment: <strong style={{ color:'var(--text-primary)' }}>{order.payment_method?.toUpperCase()}</strong> · Status: <strong style={{ color: style.color }}>{order.payment_status || order.status}</strong></p>

                          {/* Price Paid Summary */}
                          <div style={{
                            marginTop: 14,
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--r)',
                            padding: '14px 16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                          }}>
                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text-secondary)' }}>
                              <span>Subtotal</span>
                              <span>₹{Number(order.subtotal || 0).toLocaleString('en-IN')}</span>
                            </div>
                            {Number(order.discount_amount) > 0 && (
                              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#16a34a' }}>
                                <span>Discount</span>
                                <span>− ₹{Number(order.discount_amount).toLocaleString('en-IN')}</span>
                              </div>
                            )}
                            {Number(order.shipping_amount) > 0 && (
                              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text-secondary)' }}>
                                <span>Shipping</span>
                                <span>₹{Number(order.shipping_amount).toLocaleString('en-IN')}</span>
                              </div>
                            )}
                            {Number(order.shipping_amount) === 0 && (
                              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#16a34a' }}>
                                <span>Shipping</span>
                                <span>FREE</span>
                              </div>
                            )}
                            {Number(order.tax_amount) > 0 && (
                              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text-secondary)' }}>
                                <span>Tax</span>
                                <span>₹{Number(order.tax_amount).toLocaleString('en-IN')}</span>
                              </div>
                            )}
                            <div style={{ borderTop:'1px solid var(--border)', paddingTop:8, marginTop:2, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                              <span style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>Total Paid</span>
                              <span style={{ fontSize:18, fontWeight:800, fontFamily:'var(--font-display)', color:'var(--brand)' }}>
                                ₹{Number(order.total_amount || order.total || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          {/* Cancel Order Button — only for pending/confirmed */}
                          {(order.status === 'pending' || order.status === 'confirmed') && (
                            <div style={{ marginTop: 16, textAlign: 'right' }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); setCancelling(order.id); }}
                                style={{
                                  background: 'var(--danger-pale)',
                                  color: 'var(--danger)',
                                  border: '1px solid rgba(239,68,68,.25)',
                                  borderRadius: 'var(--r)',
                                  padding: '8px 18px',
                                  fontSize: 13,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all .15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = 'white'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'var(--danger-pale)'; e.currentTarget.style.color = 'var(--danger)'; }}
                              >
                                ✕ Cancel Order
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Cancel Confirmation Modal ──────────────────── */}
      <AnimatePresence>
        {cancelling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 20,
            }}
            onClick={() => setCancelling(null)}
          >
            <motion.div
              initial={{ scale: .92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: .92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--surface)', borderRadius: 'var(--r-xl)',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--s-xl)',
                padding: '28px 28px 24px',
                width: '100%', maxWidth: 420,
              }}
            >
              <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>🗑️</div>
              <h3 style={{ textAlign: 'center', marginBottom: 8, fontSize: '1.1rem' }}>Cancel this order?</h3>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
                This cannot be undone. Stock will be restored and you'll receive a confirmation email.
              </p>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 6 }}>
                  Reason (optional)
                </label>
                <select
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className="input"
                  style={{ width: '100%' }}
                >
                  <option value="">Select a reason…</option>
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Found a better price">Found a better price</option>
                  <option value="Delivery taking too long">Delivery taking too long</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => { setCancelling(null); setCancelReason(''); }}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  disabled={cancelLoading}
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelLoading}
                  style={{
                    flex: 1, background: 'var(--danger)', color: 'white',
                    border: 'none', borderRadius: 'var(--r)',
                    padding: '10px 16px', fontSize: 14, fontWeight: 700,
                    cursor: cancelLoading ? 'not-allowed' : 'pointer',
                    opacity: cancelLoading ? .7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  {cancelLoading
                    ? <><span className="spinner" style={{ borderTopColor: 'white' }} /> Cancelling…</>
                    : '✕ Yes, Cancel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════
// Dashboard
// ════════════════════════════════════════════════
export function Dashboard() {
  const { user, logout }    = useAuth();
  const navigate            = useNavigate();
  const [profile, setProfile] = React.useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving]   = React.useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/profile', profile);
      const updatedUser = { ...user, ...profile };
      localStorage.setItem('sk_user', JSON.stringify(updatedUser));
      toast.success('Profile updated! Reloading...');
      setTimeout(() => window.location.reload(), 1000);
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const QUICK_LINKS = [
    { icon: '📦', label: 'My Orders',  path: '/orders' },
    { icon: '❤️', label: 'Wishlist',   path: '/wishlist' },
    { icon: '📍', label: 'Addresses',  path: '/addresses' },
  ];

  return (
    <div className="page-wrapper" style={{ padding:'28px 0 60px', background:'var(--bg-secondary)', minHeight:'100vh' }}>
      <div className="container" style={{ maxWidth:700 }}>
        <h1 style={{ marginBottom:28 }}>My Account</h1>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{ background:'var(--surface)', border:'1px solid var(--border-light)', borderRadius:'var(--r-xl)', padding:28, marginBottom:18, boxShadow:'var(--s-sm)' }}
        >
          <div style={{ display:'flex', alignItems:'center', gap:18, marginBottom:24, paddingBottom:20, borderBottom:'1px solid var(--border-light)' }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg, var(--brand), var(--brand-dark))', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:800, fontFamily:'var(--font-display)', boxShadow:'0 6px 20px rgba(240,82,43,.35)', flexShrink:0 }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h3 style={{ fontSize:'1.15rem', marginBottom:4 }}>{user?.name}</h3>
              {user?.email && <p style={{ color:'var(--text-muted)', fontSize:13 }}>✉️ {user?.email}</p>}
              {user?.phone && <p style={{ color:'var(--text-muted)', fontSize:13 }}>📱 +91 {user?.phone}</p>}
            </div>
          </div>

          <form onSubmit={saveProfile} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <h4 style={{ fontSize:13, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.06em' }}>Edit Profile</h4>
            <div className="form-group">
              <label className="label">Full Name</label>
              <input className="input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Email Address</label>
              <input className="input" value={user?.email} disabled style={{ opacity:.6, cursor:'not-allowed' }} />
            </div>
            <div className="form-group">
              <label className="label">Phone Number</label>
              <input className="input" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="Add your phone number" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf:'flex-start' }} disabled={saving}>
              {saving ? <><span className="spinner spinner--dark" /> Saving…</> : 'Save Changes'}
            </button>
          </form>
        </motion.div>

        {/* Quick Links */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:12, marginBottom:12 }}>
          {QUICK_LINKS.map(({ icon, label, path }, i) => (
            <motion.div key={path} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.05 * i }}>
              <Link to={path} style={{ display:'flex', alignItems:'center', gap:12, padding:18, background:'var(--surface)', border:'1.5px solid var(--border-light)', borderRadius:'var(--r-lg)', color:'var(--text-primary)', fontSize:14, fontWeight:600, textDecoration:'none', transition:'all .15s', boxShadow:'var(--s-xs)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--brand)'; e.currentTarget.style.background='var(--brand-pale)'; e.currentTarget.style.color='var(--brand)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-light)'; e.currentTarget.style.background='var(--surface)'; e.currentTarget.style.color='var(--text-primary)'; }}
              >
                <span style={{ fontSize:24 }}>{icon}</span>{label}
              </Link>
            </motion.div>
          ))}
          <motion.button
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.15 }}
            onClick={() => { logout(); navigate('/'); }}
            style={{ display:'flex', alignItems:'center', gap:12, padding:18, background:'var(--danger-pale)', border:'1.5px solid rgba(239,68,68,.2)', borderRadius:'var(--r-lg)', color:'var(--danger)', fontSize:14, fontWeight:700, cursor:'pointer', transition:'all .15s', boxShadow:'var(--s-xs)' }}
          >
            <span style={{ fontSize:24 }}>🚪</span> Logout
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// AboutPage
// ════════════════════════════════════════════════
export function AboutPage() {
  return (
    <div className="page-wrapper" style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Hero */}
          <div style={{
            background: 'linear-gradient(135deg, var(--brand), #ff8c66)',
            borderRadius: 'var(--r-xl)',
            padding: '50px 40px',
            textAlign: 'center',
            color: 'white',
            marginBottom: 40,
            boxShadow: 'var(--s-md)'
          }}>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, marginBottom: 16 }}>Our Story</h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
              ShopKart is India's leading online shopping destination, dedicated to delivering quality products and premium services to millions of homes.
            </p>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
            {[
              { num: '10M+', label: 'Happy Customers' },
              { num: '50+', label: 'Categories' },
              { num: '24/7', label: 'Customer Support' }
            ].map((stat, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-lg)', padding: 24, textAlign: 'center', boxShadow: 'var(--s-xs)' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--brand)', marginBottom: 4, fontFamily: 'var(--font-display)' }}>{stat.num}</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Details */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-xl)', padding: '40px', display: 'flex', flexDirection: 'column', gap: 24, boxShadow: 'var(--s-xs)' }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Who We Are</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 15 }}>
                Founded in 2024, ShopKart began with a simple mission: to make premium shopping accessible to everyone, anywhere in India. We work directly with top brands and authorized distributors to guarantee 100% authentic products across electronics, fashion, sports, books, and more.
              </p>
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Our Core Values</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 12 }}>
                {[
                  { icon: '🤝', title: 'Customer First', desc: 'Every decision we make starts with how it benefits our customers.' },
                  { icon: '💎', title: 'Unyielding Quality', desc: 'We never compromise on the authenticity or standard of our products.' },
                  { icon: '🚀', title: 'Fast Delivery', desc: 'Our advanced logistics network ensures orders arrive as quickly as possible.' }
                ].map((val, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{val.icon}</span>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{val.title}</h4>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{val.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// CareersPage
// ════════════════════════════════════════════════
export function CareersPage() {
  const handleApply = (title) => {
    toast.success(`Application started for: ${title}! We'll contact you soon.`);
  };

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Hero */}
          <div style={{
            background: 'linear-gradient(135deg, #0A0A0C, #1A1A20)',
            borderRadius: 'var(--r-xl)',
            padding: '50px 40px',
            textAlign: 'center',
            color: 'white',
            marginBottom: 40,
            boxShadow: 'var(--s-md)',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontWeight: 800, marginBottom: 12 }}>Come Build the Future</h1>
            <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
              Join a high-growth team building India's premium shopping experience. We look for passionate, innovative people.
            </p>
          </div>

          {/* Benefits */}
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Why Work With Us?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 40 }}>
            {[
              { icon: '🏠', title: 'Remote-First', desc: 'Work from anywhere in India.' },
              { icon: '📈', title: 'Equity Options', desc: 'Own a piece of the company.' },
              { icon: '🩺', title: 'Health Insurance', desc: 'Full premium cover for your family.' },
              { icon: '📚', title: 'Learning Allowance', desc: 'Annual budget for courses & books.' }
            ].map((ben, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-lg)', padding: 20, boxShadow: 'var(--s-xs)' }}>
                <span style={{ fontSize: 24, display: 'block', marginBottom: 10 }}>{ben.icon}</span>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{ben.title}</h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{ben.desc}</p>
              </div>
            ))}
          </div>

          {/* Openings */}
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Open Positions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { title: 'Senior React Developer', team: 'Engineering', loc: 'Remote (India)', type: 'Full-time' },
              { title: 'Product Designer', team: 'Design', loc: 'Remote (India)', type: 'Full-time' },
              { title: 'Technical Support Specialist', team: 'Operations', loc: 'Bengaluru / Hybrid', type: 'Full-time' },
              { title: 'Category Manager (Fashion)', team: 'Business', loc: 'Mumbai / Hybrid', type: 'Full-time' }
            ].map((job, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-lg)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: 'var(--s-xs)' }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{job.title}</h3>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>📁 {job.team}</span>
                    <span>📍 {job.loc}</span>
                    <span>⏱️ {job.type}</span>
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => handleApply(job.title)}>Apply Now</button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// PressPage
// ════════════════════════════════════════════════
export function PressPage() {
  const handleDownload = () => {
    toast.success('Media kit download started!');
  };

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 style={{ marginBottom: 8, fontSize: '2rem', fontWeight: 800 }}>Press & News</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 30 }}>Latest updates, press releases, and media announcements from ShopKart.</p>

          {/* Media Kit Card */}
          <div style={{
            background: 'var(--surface)',
            border: '1.5px dashed var(--brand)',
            borderRadius: 'var(--r-xl)',
            padding: '24px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 20,
            marginBottom: 40
          }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Need official assets?</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Download our brand guidelines, logos, and high-resolution leadership photos.</p>
            </div>
            <button className="btn btn-primary" onClick={handleDownload}>📥 Download Media Kit</button>
          </div>

          {/* Press Releases */}
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Press Releases</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { date: 'May 18, 2026', source: 'Economic Times', title: 'ShopKart Raises $40M Series B to Expand Logistic Infrastructure across Tier-2 Cities', excerpt: 'The new capital injection will be used to enhance delivery efficiency, reduce transit times to remote districts, and double the warehousing capacity.' },
              { date: 'March 10, 2026', source: 'TechCrunch', title: 'ShopKart launches Next-Day Delivery across 50 Indian Metros', excerpt: 'Using smart routing algorithms and localized warehouses, ShopKart sets a new benchmark in fast delivery for Indian online retail.' },
              { date: 'January 15, 2026', source: 'Business Standard', title: 'ShopKart tops Consumer Trust Index for E-Commerce Platforms in 2025', excerpt: 'In an independent study, ShopKart scored highest in authentication policies, returns convenience, and overall secure transactions.' }
            ].map((item, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-lg)', padding: 24, boxShadow: 'var(--s-xs)' }}>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--brand)', fontWeight: 700, marginBottom: 8 }}>
                  <span>📆 {item.date}</span>
                  <span>•</span>
                  <span>📰 {item.source}</span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, lineHeight: 1.4 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{item.excerpt}</p>
                <a href="#" style={{ color: 'var(--brand)', textDecoration: 'none', fontWeight: 600, fontSize: 13 }} onClick={(e) => { e.preventDefault(); toast.success('Redirecting to article...'); }}>Read Full Article →</a>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// BlogPage
// ════════════════════════════════════════════════
export function BlogPage() {
  return (
    <div className="page-wrapper" style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 style={{ marginBottom: 8, fontSize: '2.2rem', fontWeight: 800 }}>ShopKart Blog</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 30 }}>Insights, trend reports, shopping guides, and product deep-dives.</p>

          {/* Featured Post */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--r-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--s-sm)',
            marginBottom: 40
          }}>
            <div style={{ height: 280, background: 'linear-gradient(135deg, #F0522B, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 36, fontWeight: 800 }}>
              🚀 Tech Trends 2026
            </div>
            <div style={{ padding: 28 }}>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--brand)', fontWeight: 700, marginBottom: 8 }}>
                <span>TECH</span>
                <span>•</span>
                <span>5 MIN READ</span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, lineHeight: 1.3 }}>
                The Future of Smart Wearables: What to Expect in 2026
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 14, marginBottom: 16 }}>
                From metabolic tracking to ambient noise filtering, smart wearables are shifting from fitness trackers to essential health assistants. Here is your comprehensive guide to the technology arriving this year.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>By <strong>Karan Mehta</strong> on June 1, 2026</span>
                <a href="#" style={{ color: 'var(--brand)', fontWeight: 700, textDecoration: 'none', fontSize: 14 }} onClick={(e) => { e.preventDefault(); toast.success('Loading post...'); }}>Read Article →</a>
              </div>
            </div>
          </div>

          {/* Grid */}
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Recent Articles</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {[
              { cat: 'FASHION', read: '3 MIN READ', title: 'Summer Essentials: Upgrading Your Wardrobe Safely', date: 'May 28, 2026' },
              { cat: 'BOOKS', read: '4 MIN READ', title: '10 Books That Will Change the Way You Think About Business', date: 'May 24, 2026' }
            ].map((blog, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-lg)', padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--s-xs)' }}>
                <div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--brand)', fontWeight: 700, marginBottom: 8 }}>
                    <span>{blog.cat}</span>
                    <span>•</span>
                    <span>{blog.read}</span>
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, lineHeight: 1.4 }}>{blog.title}</h4>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, borderTop: '1px solid var(--border-light)', paddingTop: 14 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{blog.date}</span>
                  <a href="#" style={{ color: 'var(--brand)', fontWeight: 700, textDecoration: 'none', fontSize: 13 }} onClick={(e) => { e.preventDefault(); toast.success('Loading post...'); }}>Read →</a>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// FaqPage
// ════════════════════════════════════════════════
export function FaqPage() {
  const [openIdx, setOpenIdx] = React.useState(null);

  const FAQS = [
    { q: 'How long does shipping take?', a: 'Standard shipping takes 3-5 business days depending on your location. Premium Express orders are delivered within 1-2 business days.' },
    { q: 'Can I return a product?', a: 'Yes! We offer a hassle-free 7-day return policy for most items. The items must be unused, in their original packaging, with tags intact. You can request a return directly from the "My Orders" page.' },
    { q: 'What payment methods do you accept?', a: 'We support all major credit/debit cards, UPI payments (GPay, PhonePe, Paytm), Net Banking, and Cash on Delivery (COD) for eligible pin codes.' },
    { q: 'How do I track my order?', a: 'Once your order is shipped, you will receive a tracking link via email. You can also monitor your delivery status live on our portal from your "My Orders" tab.' },
    { q: 'Is my payment transaction secure?', a: 'Absolutely. We use 256-bit SSL encryption to secure your transaction data and process all payments through PCI-DSS compliant partner gateways.' }
  ];

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: 700 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 style={{ marginBottom: 10, textAlign: 'center', fontSize: '2rem', fontWeight: 800 }}>Frequently Asked Questions</h1>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 40 }}>Need help? Find answers to commonly asked questions below.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQS.map((faq, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div key={idx} style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--s-xs)' }}>
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '20px 24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'var(--text-primary)',
                      fontWeight: 700,
                      fontSize: 15,
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ fontSize: 16, color: 'var(--brand)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: '0 24px 20px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// ContactPage
// ════════════════════════════════════════════════
export function ContactPage() {
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setForm({ name: '', email: '', subject: '', message: '' });
      toast.success("Message sent successfully! We'll reply soon.");
    }, 1200);
  };

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 style={{ marginBottom: 8, fontSize: '2rem', fontWeight: 800 }}>Contact Us</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 36 }}>Got a question, issue, or feedback? Get in touch with our customer team.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'start' }}>
            {/* Form */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-xl)', padding: 28, boxShadow: 'var(--s-xs)' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 18 }}>Send a Message</h3>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="label">Your Name *</label>
                  <input className="input" placeholder="e.g. Rahul Sen" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Email Address *</label>
                  <input className="input" type="email" placeholder="e.g. rahul@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Subject</label>
                  <input className="input" placeholder="e.g. Order Delivery Issue" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Message *</label>
                  <textarea className="input" rows="4" style={{ resize: 'vertical', paddingTop: 8, minHeight: 80 }} placeholder="Tell us how we can help..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ minHeight: 46, justifyContent: 'center' }} disabled={loading}>
                  {loading ? <><span className="spinner" /> Sending…</> : 'Send Message →'}
                </button>
              </form>
            </div>

            {/* Side info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-lg)', padding: 24, boxShadow: 'var(--s-xs)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>📞 Call Support</h4>
                <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>+91 1800 200 4545</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Toll-free · Mon-Sat, 9 AM - 6 PM</p>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-lg)', padding: 24, boxShadow: 'var(--s-xs)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>✉️ Email Support</h4>
                <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>support@shopkart.com</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Typical response time: Under 4 hours</p>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-lg)', padding: 24, boxShadow: 'var(--s-xs)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>📍 Head Office</h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  ShopKart Pvt. Ltd.<br />
                  8th Floor, Tech Hub Tower B,<br />
                  Outer Ring Road, Bengaluru, KA - 560103
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// ReturnsPage
// ════════════════════════════════════════════════
export function ReturnsPage() {
  return (
    <div className="page-wrapper" style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: 700 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 style={{ marginBottom: 10, fontSize: '2rem', fontWeight: 800 }}>Returns & Exchanges</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>We offer an easy 7-day return policy for all eligible products.</p>

          {/* Timeline Steps */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginBottom: 40 }}>
            {[
              { step: '1', title: 'Request Return', desc: 'Go to My Orders, select the order, and choose Cancel or Return.' },
              { step: '2', title: 'Pack & Pickup', desc: 'Keep items in original condition. Our partner will pick it up within 48h.' },
              { step: '3', title: 'Fast Refund', desc: 'Once verified at our center, the refund is initiated within 3-5 business days.' }
            ].map((step, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-lg)', padding: 24, textAlign: 'center', boxShadow: 'var(--s-xs)', position: 'relative' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--brand-pale)', color: 'var(--brand)',
                  display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 16, marginBottom: 12
                }}>{step.step}</div>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{step.title}</h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Policies Card */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-xl)', padding: 32, boxShadow: 'var(--s-xs)' }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Important Policies</h3>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <li><strong>Eligible Window</strong>: Returns must be requested within 7 days of delivery.</li>
              <li><strong>Condition of Goods</strong>: Items must be unused, unwashed, and have all tags, warranty cards, and original box intact.</li>
              <li><strong>Exceptions</strong>: Certain hygiene-related products, custom items, and select promotional items cannot be returned. Please check the product description page.</li>
              <li><strong>Exchange Policy</strong>: Want a different size or color? Request an exchange from the orders page, and we will ship the replacement for free.</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// PrivacyPage
// ════════════════════════════════════════════════
export function PrivacyPage() {
  return (
    <div className="page-wrapper" style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: 700 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-xl)', padding: '40px', boxShadow: 'var(--s-xs)' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 10 }}>Privacy Policy</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Last Updated: June 1, 2026</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <p>Welcome to ShopKart. We value your privacy and are committed to protecting your personal information. This Privacy Policy details how we collect, store, and utilize your data when you interact with our e-commerce platform.</p>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>1. Information We Collect</h3>
            <p>We collect information you directly provide when registering an account, placing an order, or contacting customer support. This includes your name, email address, phone number, shipping address, and payment preferences.</p>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>2. How We Use Your Data</h3>
            <p>Your details are processed to complete transactions, deliver ordered products, send shipping notifications, communicate order statuses, and personalize your overall website experience.</p>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>3. Cookies & Analytics</h3>
            <p>We use cookies to retain your shopping cart contents, active login sessions, and to analyze traffic patterns. You can customize cookie preferences in your browser settings.</p>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>4. Third-Party Sharing</h3>
            <p>We do not sell or lease your personal information. We share relevant data only with trusted logistics partners to execute delivery and secure payment gateway providers to complete transactions.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// TermsPage
// ════════════════════════════════════════════════
export function TermsPage() {
  return (
    <div className="page-wrapper" style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: 700 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-xl)', padding: '40px', boxShadow: 'var(--s-xs)' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 10 }}>Terms of Use</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Last Updated: June 1, 2026</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <p>By accessing or utilizing the ShopKart web application, you agree to be bound by these Terms of Use. Please read them carefully before making any purchase.</p>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>1. User Accounts</h3>
            <p>When you register on ShopKart, you are responsible for maintaining the confidentiality of your credentials and restricting unauthorized access to your devices. You agree to accept liability for all activities that occur under your user profile.</p>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>2. Orders & Cancellations</h3>
            <p>We reserve the right to refuse or cancel any order for reasons such as product availability issues, inaccuracies in pricing, or detection of potential transaction fraud. If an online paid order is cancelled, we will initiate a prompt refund.</p>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>3. Product Specifications</h3>
            <p>We strive to exhibit our inventory colors and specifications as accurately as possible. However, the visual fidelity depends on your display screen calibration, and we cannot guarantee complete match representation.</p>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>4. Intellectual Property</h3>
            <p>All brand content, site layout, graphics, text assets, product descriptions, and code utilized on ShopKart are protected by copyright laws. You may not reuse, redistribute, or reproduce any material without our written permission.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// SitemapPage
// ════════════════════════════════════════════════
export function SitemapPage() {
  const SITEMAP_GROUPS = [
    {
      title: 'Main Navigation',
      links: [
        { label: 'Home Page', path: '/' },
        { label: 'All Products', path: '/products' },
        { label: 'Shopping Cart', path: '/cart' },
        { label: 'Wishlist', path: '/wishlist' }
      ]
    },
    {
      title: 'Categories',
      links: [
        { label: 'Books', path: '/category/books' },
        { label: 'Fashion', path: '/category/fashion' },
        { label: 'Electronics', path: '/category/electronics' },
        { label: 'Sports', path: '/category/sports' }
      ]
    },
    {
      title: 'Company & Support',
      links: [
        { label: 'About Us', path: '/about' },
        { label: 'Careers', path: '/careers' },
        { label: 'Press & News', path: '/press' },
        { label: 'ShopKart Blog', path: '/blog' },
        { label: 'Contact Us', path: '/contact' },
        { label: 'FAQs', path: '/faq' },
        { label: 'Returns & Policies', path: '/returns' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', path: '/privacy' },
        { label: 'Terms of Use', path: '/terms' }
      ]
    }
  ];

  return (
    <div className="page-wrapper" style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 style={{ marginBottom: 12, fontSize: '2rem', fontWeight: 800 }}>Sitemap</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 36 }}>A complete structured list of all pages and directories on ShopKart.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {SITEMAP_GROUPS.map((group, idx) => (
              <div key={idx} style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-lg)', padding: 24, boxShadow: 'var(--s-xs)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 16 }}>{group.title}</h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {group.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      <Link to={link.path} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.12s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--brand)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
                      >
                        • {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
