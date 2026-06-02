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
  const [orders, setOrders]     = React.useState([]);
  const [loading, setLoading]   = React.useState(true);
  const [expanded, setExpanded] = React.useState(null);

  React.useEffect(() => {
    api.get('/orders').then(r => setOrders(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

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
                          <p style={{ fontSize:12, color:'var(--text-muted)' }}>Payment: <strong style={{ color:'var(--text-primary)' }}>{order.payment_method}</strong> · Status: <strong style={{ color: style.color }}>{order.status}</strong></p>
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
    </div>
  );
}

// ════════════════════════════════════════════════
// Dashboard
// ════════════════════════════════════════════════
export function Dashboard() {
  const { user, logout }    = useAuth();
  const navigate            = useNavigate();
  const [profile, setProfile] = React.useState({ name: user?.name || '', email: user?.email || '' });
  const [saving, setSaving]   = React.useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/profile', profile);
      toast.success('Profile updated!');
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
              <p style={{ color:'var(--text-muted)', fontSize:13 }}>📱 +91 {user?.phone}</p>
              {user?.email && <p style={{ color:'var(--text-muted)', fontSize:13 }}>✉️ {user?.email}</p>}
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
              <input className="input" type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="Add your email" />
            </div>
            <div className="form-group">
              <label className="label">Phone Number</label>
              <input className="input" value={`+91 ${user?.phone}`} disabled style={{ opacity:.6, cursor:'not-allowed' }} />
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
