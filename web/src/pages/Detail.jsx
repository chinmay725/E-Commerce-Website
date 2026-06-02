import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../ctx/CartContext';
import { useAuth } from '../ctx/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import ProductCard, { ProductCardSkeleton } from '../components/card/ProductCard';
import './Detail.css';

const Stars = ({ rating, size = 15 }) => (
  <div className="stars" style={{ fontSize: size }}>
    {[1,2,3,4,5].map(n => (
      <span key={n} className={`star${n > Math.round(rating) ? ' empty' : ''}`}>★</span>
    ))}
  </div>
);

const OFFERS = [
  { icon: '🏷', text: 'Bank Offer: 10% off on HDFC Credit Cards, up to ₹1500' },
  { icon: '💳', text: 'No Cost EMI: Available on select cards from ₹3000+' },
  { icon: '🎁', text: 'Special Price: Get extra 5% off (price inclusive of cashback/coupon)' },
];

export default function ProductDetail() {
  const { slug }    = useParams();
  const { addToCart } = useCart();
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty]           = useState(1);
  const [adding, setAdding]     = useState(false);
  const [buyNow, setBuyNow]     = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [zoomed, setZoomed]     = useState(false);
  const [zoomPos, setZoomPos]   = useState({ x: 50, y: 50 });
  const zoomRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);
    setActiveImg(0);
    api.get(`/products/${slug}`)
      .then(r => setProduct(r.data.data))
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = async () => {
    setAdding(true);
    await addToCart(product.id, qty);
    setAdding(false);
  };

  const handleBuyNow = async () => {
    if (!user) { navigate('/login'); return; }
    setBuyNow(true);
    await addToCart(product.id, qty);
    setBuyNow(false);
    navigate('/checkout');
  };

  const handleWishlist = async () => {
    try {
      if (inWishlist) {
        await api.delete(`/users/wishlist/${product.id}`);
        toast.success('Removed from wishlist');
      } else {
        await api.post('/users/wishlist', { product_id: product.id });
        toast.success('Added to wishlist ❤️');
      }
      setInWishlist(!inWishlist);
    } catch { toast.error('Please login to use wishlist'); }
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  // Loading skeleton
  if (loading) return (
    <div className="product-detail page-wrapper">
      <div className="container">
        <div className="detail-skeleton">
          <div className="skeleton" style={{ height: 420, borderRadius: 'var(--r-lg)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[100, 240, 80, 140, 60, 80, 200].map((w, i) => (
              <div key={i} className="skeleton" style={{ height: i === 2 ? 32 : 18, width: `${w}px`, borderRadius: 4 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 64 }}>😕</div>
      <h2>Product not found</h2>
      <Link to="/products" className="btn btn-primary">Browse Products</Link>
    </div>
  );

  const images   = product.images?.filter(i => i.url)?.length
    ? product.images
    : [{ url: product.thumbnail_url, alt_text: product.name }];
  const discount = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;
  const inStock  = product.stock > 0;

  const TABS = [
    { id: 'description', label: 'Description' },
    { id: 'specs',       label: 'Specifications' },
    { id: 'reviews',     label: `Reviews (${product.reviews?.length || 0})` },
  ];

  return (
    <div className="product-detail page-wrapper">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="sep">›</span>
          <Link to={`/category/${product.category_slug}`}>{product.category_name}</Link>
          <span className="sep">›</span>
          <span>{product.name}</span>
        </nav>

        {/* Main Layout */}
        <div className="detail-layout">
          {/* Gallery */}
          <div className="detail-gallery">
            <div className="gallery-thumbs" role="listbox" aria-label="Product images">
              {images.map((img, i) => (
                <button
                  key={i}
                  className={`thumb${activeImg === i ? ' active' : ''}`}
                  onClick={() => setActiveImg(i)}
                  role="option"
                  aria-selected={activeImg === i}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={img.url || '/placeholder.png'} alt={img.alt_text || product.name} loading="lazy" />
                </button>
              ))}
            </div>

            <div
              ref={zoomRef}
              className={`gallery-main${zoomed ? ' zoomed' : ''}`}
              onMouseEnter={() => setZoomed(true)}
              onMouseLeave={() => setZoomed(false)}
              onMouseMove={handleMouseMove}
              aria-label="Product image"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImg}
                  src={images[activeImg]?.url || '/placeholder.png'}
                  alt={product.name}
                  initial={{ opacity: 0, scale: .97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: .18 }}
                  style={zoomed
                    ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`, transform: 'scale(2)' }
                    : {}}
                  draggable={false}
                />
              </AnimatePresence>
              {!inStock && (
                <div className="detail-oos-overlay" aria-hidden="true">
                  <span>Out of Stock</span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <motion.div
            className="detail-info"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: .35 }}
          >
            {product.brand_name && (
              <p className="detail-brand" aria-label={`Brand: ${product.brand_name}`}>{product.brand_name}</p>
            )}
            <h1 className="detail-name">{product.name}</h1>

            {/* Rating */}
            {product.avg_rating > 0 && (
              <div className="detail-rating">
                <div className="rating-score">
                  <strong>{product.avg_rating}</strong>
                  <Stars rating={product.avg_rating} />
                </div>
                <span className="rating-sep">|</span>
                <a href="#reviews-section" className="review-link">
                  {product.review_count} Reviews
                </a>
              </div>
            )}

            {/* Price */}
            <div className="detail-price">
              <span className="price-main">₹{product.price?.toLocaleString('en-IN')}</span>
              {product.mrp && product.mrp > product.price && (
                <span className="price-mrp">₹{product.mrp?.toLocaleString('en-IN')}</span>
              )}
              {discount >= 5 && (
                <span className="discount-badge">{discount}% off</span>
              )}
            </div>

            {product.short_description && (
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {product.short_description}
              </p>
            )}

            {/* Stock */}
            <div className="detail-stock" aria-live="polite">
              <div className={`stock-dot ${inStock ? 'in' : 'out'}`} aria-hidden="true" />
              {inStock
                ? <>In Stock {product.stock <= 5 && <span style={{ color: 'var(--brand)', marginLeft: 6 }}>(Only {product.stock} left!)</span>}</>
                : 'Out of Stock'
              }
            </div>

            {/* Qty */}
            {inStock && (
              <div className="detail-actions">
                <div className="qty-row">
                  <span className="qty-label">Qty:</span>
                  <div className="qty-control" role="group" aria-label="Quantity selector">
                    <button
                      className="qty-btn"
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      aria-label="Decrease quantity"
                    >−</button>
                    <span className="qty-value" aria-live="polite">{qty}</span>
                    <button
                      className="qty-btn"
                      onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                      disabled={qty >= product.stock}
                      aria-label="Increase quantity"
                    >+</button>
                  </div>
                </div>

                <div className="btn-row">
                  <motion.button
                    className="btn btn-primary btn-lg"
                    onClick={handleAddToCart}
                    disabled={adding}
                    whileTap={{ scale: .97 }}
                  >
                    {adding ? <span className="spinner" /> : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                          <line x1="3" y1="6" x2="21" y2="6"/>
                          <path d="M16 10a4 4 0 0 1-8 0"/>
                        </svg>
                        Add to Cart
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    className="wishlist-btn-detail"
                    onClick={handleWishlist}
                    whileTap={{ scale: .85 }}
                    className={`wishlist-btn-detail${inWishlist ? ' active' : ''}`}
                    aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    aria-pressed={inWishlist}
                  >
                    {inWishlist ? '❤️' : '🤍'}
                  </motion.button>
                </div>

                <motion.button
                  className="btn btn-outline btn-lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handleBuyNow}
                  disabled={buyNow}
                  whileTap={{ scale: .97 }}
                >
                  {buyNow ? <span className="spinner spinner--dark" /> : '⚡ Buy Now'}
                </motion.button>
              </div>
            )}

            {/* Offers */}
            <div className="delivery-info">
              {OFFERS.map((o, i) => (
                <div key={i} className="delivery-row">
                  <span className="delivery-icon" aria-hidden="true">{o.icon}</span>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{o.text}</p>
                </div>
              ))}
            </div>

            {/* Delivery info */}
            <div className="delivery-info">
              <div className="delivery-row">
                <span className="delivery-icon" aria-hidden="true">🚚</span>
                <div>
                  <strong>Free Delivery</strong>
                  <span> on orders above ₹499</span>
                </div>
              </div>
              <div className="delivery-row">
                <span className="delivery-icon" aria-hidden="true">🔄</span>
                <div>
                  <strong>7-Day Returns</strong>
                  <span> Easy & hassle-free</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div style={{ marginTop: 52 }}>
          <div className="detail-tabs" role="tablist">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`detail-tab${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="detail-tab-content"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: .18 }}
            >
              {activeTab === 'description' && (
                <div style={{ maxWidth: 720 }}>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                    {product.description || 'No description available for this product.'}
                  </p>
                </div>
              )}

              {activeTab === 'specs' && (
                product.specifications ? (
                  <dl className="spec-table">
                    {Object.entries(product.specifications).map(([k, v]) => (
                      <div key={k} className="spec-row">
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No specifications available.</p>
                )
              )}

              {activeTab === 'reviews' && (
                <div id="reviews-section">
                  {product.reviews?.length > 0 ? (
                    <div className="reviews-list">
                      {product.reviews.map(r => (
                        <div key={r.id} className="review-item">
                          <div className="review-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: 'var(--brand)', color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: 14, flexShrink: 0,
                              }}>
                                {r.user_name?.[0]?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <p className="reviewer-name">{r.user_name}</p>
                                <Stars rating={r.rating} size={12} />
                              </div>
                            </div>
                            <span className="review-date">{new Date(r.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                          </div>
                          {r.title && <p className="review-title">{r.title}</p>}
                          {r.body  && <p className="review-body">{r.body}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: 40, marginBottom: 12, opacity: .5 }}>💬</div>
                      <p>No reviews yet. Be the first to review this product!</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Similar Products */}
        {product.similar?.length > 0 && (
          <section className="related-section" aria-label="Similar products">
            <div className="section-header">
              <h2 className="section-title">Similar Products</h2>
              <Link to={`/category/${product.category_slug}`} className="section-link">See All →</Link>
            </div>
            <div className="products-grid">
              {product.similar.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
