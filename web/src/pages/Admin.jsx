import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../ctx/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './Admin.css';

// ── Stat Card ──────────────────────────────────────────
const StatCard = ({ icon, label, value, color, sub, delay = 0 }) => (
  <motion.div
    className="stat-card"
    style={{ '--stat-color': color }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ y: -3 }}
  >
    <div className="stat-icon">{icon}</div>
    <div>
      <p className="stat-label">{label}</p>
      <h3 className="stat-value">{value}</h3>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  </motion.div>
);

// ── Product Form Modal (Add + Edit) ───────────────────
function ProductModal({ categories, brands, product, onClose, onSave }) {
  const isEdit = !!product;
  const blank = {
    name: '', description: '', short_description: '',
    category_id: '', brand_id: '', price: '', mrp: '',
    stock: '10', is_featured: false, is_trending: false,
    images: [{ url: '', alt: '' }],
  };

  const [form, setForm] = useState(() => {
    if (!isEdit) return blank;
    return {
      name:              product.name || '',
      description:       product.description || '',
      short_description: product.short_description || '',
      category_id:       product.category_id || '',
      brand_id:          product.brand_id || '',
      price:             product.price || '',
      mrp:               product.mrp || '',
      stock:             product.stock ?? 10,
      is_featured:       !!product.is_featured,
      is_trending:       !!product.is_trending,
      images:            product.thumbnail_url
                           ? [{ url: product.thumbnail_url, alt: product.name }]
                           : [{ url: '', alt: '' }],
    };
  });

  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Live thumbnail preview from first image URL
  const previewUrl = form.images[0]?.url?.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price:   parseFloat(form.price),
        mrp:     parseFloat(form.mrp) || null,
        stock:   parseInt(form.stock) || 0,
        images:  form.images.filter(i => i.url.trim()),
      };
      if (isEdit) {
        await api.put(`/products/${product.id}`, payload);
        toast.success('Product updated!');
      } else {
        await api.post('/products', payload);
        toast.success('Product created!');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} product`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal"
        onClick={e => e.stopPropagation()}
        initial={{ scale: .93, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: .93, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="modal-header">
          <h3>{isEdit ? '✏️ Edit Product' : '➕ Add New Product'}</h3>
          <button onClick={onClose} className="modal-close" aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Name + Category */}
          <div className="form-row" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="label">Product Name *</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)}
                required placeholder="e.g. iPhone 15 Pro" />
            </div>
            <div className="form-group">
              <label className="label">Category *</label>
              <select className="input" value={form.category_id} onChange={e => set('category_id', e.target.value)} required>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Price + MRP + Stock */}
          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: 16 }}>
            <div className="form-group">
              <label className="label">Price (₹) *</label>
              <input className="input" type="number" value={form.price} onChange={e => set('price', e.target.value)}
                required min="0" step="0.01" placeholder="0" />
            </div>
            <div className="form-group">
              <label className="label">MRP (₹)</label>
              <input className="input" type="number" value={form.mrp} onChange={e => set('mrp', e.target.value)}
                min="0" step="0.01" placeholder="0" />
            </div>
            <div className="form-group">
              <label className="label">Stock</label>
              <input className="input" type="number" value={form.stock} onChange={e => set('stock', e.target.value)} min="0" />
            </div>
          </div>

          {/* Brand */}
          {brands.length > 0 && (
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="label">Brand</label>
              <select className="input" value={form.brand_id} onChange={e => set('brand_id', e.target.value)}>
                <option value="">No brand</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          {/* Short description */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="label">Short Description</label>
            <input className="input" value={form.short_description} onChange={e => set('short_description', e.target.value)}
              placeholder="One-line product summary shown in listings" />
          </div>

          {/* Full description */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="label">Full Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Detailed product description" style={{ resize: 'vertical', minHeight: 80 }} />
          </div>

          {/* Images + preview */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="label">Product Images (URLs)</label>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                {form.images.map((img, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      className="input"
                      placeholder={i === 0 ? 'Primary image URL (shown in listings)' : `Image ${i + 1} URL`}
                      value={img.url}
                      onChange={e => {
                        const imgs = [...form.images];
                        imgs[i] = { ...imgs[i], url: e.target.value };
                        set('images', imgs);
                      }}
                    />
                    {i > 0 && (
                      <button type="button" className="btn btn-secondary btn-sm"
                        onClick={() => set('images', form.images.filter((_, j) => j !== i))}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm"
                  onClick={() => set('images', [...form.images, { url: '', alt: '' }])}>
                  + Add Image
                </button>
              </div>
              {/* Live preview */}
              {previewUrl && (
                <div style={{
                  width: 90, height: 90, flexShrink: 0,
                  border: '2px solid var(--border-light)',
                  borderRadius: 'var(--r-md)',
                  overflow: 'hidden', background: 'var(--bg-secondary)',
                }}>
                  <img
                    src={previewUrl}
                    alt="preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Featured / Trending toggles */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
            {[['is_featured', '⭐ Featured'], ['is_trending', '🔥 Trending']].map(([key, label]) => (
              <label key={key} className="toggle-inline" style={{ cursor: 'pointer', userSelect: 'none' }}>
                <button
                  type="button"
                  className={`admin-toggle${form[key] ? ' on' : ''}`}
                  onClick={() => set(key, !form[key])}
                  aria-checked={form[key]} role="switch"
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
              </label>
            ))}
          </div>

          {/* Discount badge preview */}
          {form.mrp && form.price && parseFloat(form.mrp) > parseFloat(form.price) && (
            <div style={{
              background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)',
              borderRadius: 'var(--r)', padding: '8px 14px', marginBottom: 16,
              fontSize: 13, fontWeight: 600, color: 'var(--success)',
            }}>
              💚 {Math.round((1 - parseFloat(form.price) / parseFloat(form.mrp)) * 100)}% discount — customers will see this
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main Admin Dashboard ───────────────────────────────
export default function Admin() {
  const { user, isAdmin }         = useAuth();
  const navigate                  = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts]   = useState([]);
  const [orders, setOrders]       = useState([]);
  const [users, setUsers]         = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands]       = useState([]);
  const [addModal, setAddModal]   = useState(false);
  const [editProduct, setEditProduct] = useState(null); // product being edited
  const [deleteConfirm, setDeleteConfirm] = useState(null); // product to soft-delete
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    loadData();
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dash, cats, brnds] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/categories'),
        api.get('/products/brands').catch(() => ({ data: { data: [] } })),
      ]);
      setDashboard(dash.data.data);
      setCategories(cats.data.data);
      setBrands(brnds.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  const loadTab = async (tab) => {
    setActiveTab(tab);
    setSearch('');
    try {
      if (tab === 'products') {
        const { data } = await api.get('/admin/products');
        setProducts(data.data);
      } else if (tab === 'orders') {
        const { data } = await api.get('/admin/orders');
        setOrders(data.data);
      } else if (tab === 'users') {
        const { data } = await api.get('/admin/users');
        setUsers(data.data);
      }
    } catch {}
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await api.patch(`/admin/orders/${id}/status`, { status });
      const { data } = await api.get('/admin/orders');
      setOrders(data.data);
      toast.success('Order status updated');
    } catch { toast.error('Failed to update'); }
  };

  const refreshProducts = async () => {
    const { data } = await api.get('/admin/products');
    setProducts(data.data);
  };

  const toggleProduct = async (id, isActive) => {
    await api.put(`/products/${id}`, { is_active: isActive ? 0 : 1 });
    await refreshProducts();
    toast.success(isActive ? 'Product deactivated' : 'Product activated');
  };

  const handleDeleteProduct = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product removed');
      setDeleteConfirm(null);
      await refreshProducts();
    } catch { toast.error('Failed to remove product'); }
  };  if (!isAdmin) return null;

  const NAV = [
    { section: 'Overview' },
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { section: 'Management' },
    { id: 'products',  icon: '📦', label: 'Products' },
    { id: 'orders',    icon: '🛒', label: 'Orders' },
    { id: 'users',     icon: '👥', label: 'Customers' },
  ];

  const filteredProducts = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredOrders = orders.filter(o =>
    !search || o.order_number?.includes(search) || o.user_name?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredUsers = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search)
  );

  return (
    <div className="admin page-wrapper">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-logo">SK</div>
          <div>
            <strong>Admin Panel</strong>
            <p>{user?.name}</p>
          </div>
        </div>
        <nav className="admin-nav">
          {NAV.map((item, i) =>
            item.section ? (
              <div key={i} className="admin-nav-section">{item.section}</div>
            ) : (
              <button
                key={item.id}
                className={`admin-nav-item${activeTab === item.id ? ' active' : ''}`}
                onClick={() => loadTab(item.id)}
              >
                <span>{item.icon}</span> {item.label}
              </button>
            )
          )}
        </nav>
        <Link to="/" className="admin-nav-item" style={{ marginTop: 'auto' }}>
          <span>←</span> Back to Store
        </Link>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <AnimatePresence mode="wait">

          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="admin-page-header">
                <h2>Dashboard Overview</h2>
                <button className="btn btn-secondary btn-sm" onClick={loadData}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  Refresh
                </button>
              </div>
              {loading ? (
                <div className="stats-grid">
                  {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--r-lg)' }} />)}
                </div>
              ) : dashboard && (
                <>
                  <div className="stats-grid">
                    <StatCard icon="💰" label="Total Revenue" value={`₹${dashboard.stats.revenue?.toLocaleString('en-IN') || 0}`} color="var(--brand)" sub="All time" delay={0} />
                    <StatCard icon="📦" label="Total Orders"  value={dashboard.stats.orders || 0}    color="var(--info)"    sub={`${dashboard.stats.pendingOrders || 0} pending`} delay={0.06} />
                    <StatCard icon="🛍" label="Products"      value={dashboard.stats.products || 0}   color="var(--success)" delay={0.12} />
                    <StatCard icon="👥" label="Customers"     value={dashboard.stats.users || 0}      color="var(--accent)"  delay={0.18} />
                  </div>

                  <div className="admin-table-wrap" style={{ marginBottom: 24 }}>
                    <div className="admin-table-head">
                      <h3>Recent Orders</h3>
                    </div>
                    <table className="admin-table">
                      <thead>
                        <tr><th>Order #</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr>
                      </thead>
                      <tbody>
                        {dashboard.recentOrders?.map(o => (
                          <tr key={o.id}>
                            <td><code style={{ fontSize: 12, background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 4 }}>#{o.order_number}</code></td>
                            <td style={{ fontWeight: 500 }}>{o.user_name}</td>
                            <td style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>₹{o.total?.toLocaleString('en-IN')}</td>
                            <td><span className={`status-pill ${o.status}`}>{o.status}</span></td>
                            <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="admin-table-wrap">
                    <div className="admin-table-head"><h3>Top Selling Products</h3></div>
                    <table className="admin-table">
                      <thead><tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead>
                      <tbody>
                        {dashboard.topProducts?.map((p, i) => (
                          <tr key={i}>
                            <td style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{i + 1}</td>
                            <td>
                              <div className="product-cell">
                                {p.thumbnail_url && <img src={p.thumbnail_url} alt="" />}
                                <div><strong>{p.name}</strong></div>
                              </div>
                            </td>
                            <td style={{ fontWeight: 700 }}>{p.sold}</td>
                            <td style={{ fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--success)' }}>₹{p.revenue?.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Products */}
          {activeTab === 'products' && (
            <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="admin-page-header">
                <h2>Products ({filteredProducts.length})</h2>
                <button className="btn btn-primary" onClick={() => setAddModal(true)}>
                  + Add Product
                </button>
              </div>
              <div className="admin-table-wrap">
                <div className="admin-table-head">
                  <h3>All Products</h3>
                  <input
                    className="admin-search"
                    placeholder="Search products…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ paddingLeft: 14 }}
                  />
                </div>
                <table className="admin-table">
                  <thead>
                    <tr><th>Product</th><th>Category</th><th>Price</th><th>MRP</th><th>Stock</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="product-cell">
                            {p.thumbnail_url && <img src={p.thumbnail_url} alt={p.name} />}
                            <div>
                              <strong>{p.name}</strong>
                              <span>{p.brand_name || ''}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{p.category_name}</td>
                        <td style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>₹{p.price?.toLocaleString('en-IN')}</td>
                        <td style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>{p.mrp ? `₹${p.mrp?.toLocaleString('en-IN')}` : '—'}</td>
                        <td>
                          <span style={{ color: p.stock <= 5 ? 'var(--brand)' : 'var(--text-primary)', fontWeight: 600 }}>
                            {p.stock}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${p.is_active ? 'delivered' : 'cancelled'}`}>
                            {p.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => toggleProduct(p.id, p.is_active)}>
                              {p.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Orders */}
          {activeTab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="admin-page-header">
                <h2>Orders ({filteredOrders.length})</h2>
              </div>
              <div className="admin-table-wrap">
                <div className="admin-table-head">
                  <h3>All Orders</h3>
                  <input
                    className="admin-search"
                    placeholder="Search order # or name…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ paddingLeft: 14 }}
                  />
                </div>
                <table className="admin-table">
                  <thead>
                    <tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Update Status</th></tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(o => (
                      <tr key={o.id}>
                        <td><code style={{ fontSize: 12, background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 4 }}>#{o.order_number}</code></td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{o.user_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.phone}</div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{o.item_count}</td>
                        <td style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>₹{o.total?.toLocaleString('en-IN')}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{o.payment_method}</td>
                        <td><span className={`status-pill ${o.status}`}>{o.status}</span></td>
                        <td>
                          <select
                            className="input"
                            style={{ padding: '5px 10px', fontSize: 12, height: 34, width: 130 }}
                            value={o.status}
                            onChange={e => updateOrderStatus(o.id, e.target.value)}
                          >
                            {['pending','confirmed','processing','shipped','delivered','cancelled'].map(s => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Users */}
          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="admin-page-header">
                <h2>Customers ({filteredUsers.length})</h2>
              </div>
              <div className="admin-table-wrap">
                <div className="admin-table-head">
                  <h3>All Customers</h3>
                  <input
                    className="admin-search"
                    placeholder="Search by name or phone…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ paddingLeft: 14 }}
                  />
                </div>
                <table className="admin-table">
                  <thead>
                    <tr><th>Name</th><th>Phone</th><th>Email</th><th>Role</th><th>Verified</th><th>Joined</th></tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%',
                              background: 'var(--brand)', color: 'white',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, fontWeight: 800, flexShrink: 0,
                            }}>
                              {u.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <span style={{ fontWeight: 600 }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{u.phone}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{u.email || '—'}</td>
                        <td><span className={`status-pill ${u.role === 'admin' ? 'shipped' : 'delivered'}`}>{u.role}</span></td>
                        <td>{u.is_verified ? <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Add Product Modal */}
      <AnimatePresence>
        {addModal && (
          <AddProductModal
            categories={categories}
            onClose={() => setAddModal(false)}
            onSave={() => { if (activeTab === 'products') loadTab('products'); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
