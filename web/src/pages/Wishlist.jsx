import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../ctx/CartContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart }       = useCart();

  const fetchWishlist = () => {
    api.get('/users/wishlist')
      .then(r => setItems(r.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWishlist(); }, []);

  const removeItem = async (productId) => {
    await api.delete(`/users/wishlist/${productId}`);
    setItems(prev => prev.filter(i => i.product_id !== productId));
    toast.success('Removed from wishlist');
  };

  const moveToCart = async (item) => {
    await addToCart(item.product_id);
    await removeItem(item.product_id);
  };

  if (loading) return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="spinner" style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    </div>
  );

  return (
    <div className="page-wrapper" style={{ padding: '32px 0 60px' }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h1>My Wishlist ({items.length})</h1>
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 80, marginBottom: 20 }}>🤍</div>
            <h2 style={{ marginBottom: 12 }}>Your wishlist is empty</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Save products you love and come back to them anytime</p>
            <Link to="/products" className="btn btn-primary btn-lg">Explore Products</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            <AnimatePresence>
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Link to={`/product/${item.slug}`} style={{ position: 'relative' }}>
                    <img
                      src={item.thumbnail_url || '/placeholder.png'}
                      alt={item.name}
                      style={{ width: '100%', height: 180, objectFit: 'contain', background: 'var(--bg-secondary)', padding: 12 }}
                    />
                    {item.mrp > item.price && (
                      <span style={{
                        position: 'absolute', top: 10, left: 10,
                        background: 'var(--primary)', color: 'white',
                        fontSize: 10, fontWeight: 700,
                        padding: '2px 8px', borderRadius: 'var(--radius-full)',
                      }}>
                        {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF
                      </span>
                    )}
                  </Link>
                  <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Link to={`/product/${item.slug}`}>
                      <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.name}</p>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>₹{item.price?.toLocaleString('en-IN')}</span>
                      {item.mrp > item.price && <span style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{item.mrp?.toLocaleString('en-IN')}</span>}
                    </div>
                    {item.avg_rating > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        <span style={{ background: 'var(--success)', color: 'white', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>{item.avg_rating} ★</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '0 14px 14px', display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => moveToCart(item)}
                    >
                      🛒 Add to Cart
                    </button>
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => removeItem(item.product_id)}
                      title="Remove"
                    >
                      🗑
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
