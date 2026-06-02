import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard, { ProductCardSkeleton } from '../components/card/ProductCard';
import api from '../lib/api';
import './Home.css';

const BANNERS = [
  {
    id: 1,
    title: 'iPhone 15 Pro',
    sub: 'Titanium. So strong, so light. Forged in a new grade of titanium.',
    bg: 'linear-gradient(135deg,#1C1C1E 0%,#2C2C2E 40%,#3A3A3C 100%)',
    cta: 'Shop Mobiles',
    img: '📱',
    slug: 'mobiles',
    accent: '#FF453A',
  },
  {
    id: 2,
    title: 'Fashion Forward',
    sub: 'Up to 70% off on top brands. New arrivals every day.',
    bg: 'linear-gradient(135deg,#7C2D12 0%,#DC2626 50%,#F97316 100%)',
    cta: 'Shop Fashion',
    img: '👗',
    slug: 'fashion',
    accent: '#FBBF24',
  },
  {
    id: 3,
    title: 'Smart Living',
    sub: 'Appliances & home essentials built for modern life.',
    bg: 'linear-gradient(135deg,#064E3B 0%,#059669 50%,#34D399 100%)',
    cta: 'Explore Home',
    img: '🏠',
    slug: 'appliances',
    accent: '#6EE7B7',
  },
  {
    id: 4,
    title: 'Sports Season',
    sub: 'Gear up. Train harder. Perform better.',
    bg: 'linear-gradient(135deg,#1E1B4B 0%,#4F46E5 50%,#818CF8 100%)',
    cta: 'Shop Sports',
    img: '⚽',
    slug: 'sports',
    accent: '#C7D2FE',
  },
];

const CATEGORIES = [
  { name: 'Mobiles',     slug: 'mobiles',      icon: '📱', color: '#DBEAFE' },
  { name: 'Fashion',     slug: 'fashion',      icon: '👗', color: '#FCE7F3' },
  { name: 'Appliances',  slug: 'appliances',   icon: '🏠', color: '#D1FAE5' },
  { name: 'Sports',      slug: 'sports',       icon: '⚽', color: '#FEF3C7' },
  { name: 'Health',      slug: 'health',       icon: '💊', color: '#FFE4E6' },
  { name: 'Electronics', slug: 'electronics',  icon: '💻', color: '#E0E7FF' },
  { name: 'Books',       slug: 'books',        icon: '📚', color: '#F3E8FF' },
  { name: 'Home & Kitchen',slug:'home-kitchen',icon: '🛋', color: '#FFF7ED' },
];

const OFFERS = [
  { icon: '🚀', title: 'Free Delivery',   sub: 'On orders above ₹499', bg: '#EFF6FF' },
  { icon: '🔄', title: 'Easy Returns',    sub: '7-day hassle-free',    bg: '#F0FDF4' },
  { icon: '🔒', title: 'Secure Payment',  sub: '100% safe checkout',   bg: '#FFF7ED' },
  { icon: '🎁', title: 'Best Prices',     sub: 'Price match guarantee',bg: '#FDF4FF' },
];

function useCountdown(targetMs) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, targetMs - Date.now());
      setTime({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  return time;
}

function FlashSale() {
  // Flash sale ends 8 hours from page load
  const [target] = useState(() => Date.now() + 8 * 3600000);
  const { h, m, s } = useCountdown(target);
  const pad = n => String(n).padStart(2, '0');

  return (
    <div className="flash-strip">
      <div className="flash-strip__inner">
        <div className="flash-label">
          <span>⚡</span>
          <strong>Flash Sale</strong>
        </div>
        <div className="flash-timer">
          <div className="timer-unit"><strong>{pad(h)}</strong><small>hrs</small></div>
          <span className="timer-sep">:</span>
          <div className="timer-unit"><strong>{pad(m)}</strong><small>min</small></div>
          <span className="timer-sep">:</span>
          <div className="timer-unit"><strong>{pad(s)}</strong><small>sec</small></div>
        </div>
        <Link to="/products?trending=1" className="btn btn-sm" style={{ background: 'rgba(255,255,255,.12)', color: 'white', border: '1px solid rgba(255,255,255,.2)', marginLeft: 'auto' }}>
          See Deals →
        </Link>
      </div>
    </div>
  );
}

function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused]   = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % BANNERS.length), 5000);
    return () => clearInterval(t);
  }, [paused]);

  const b = BANNERS[current];

  return (
    <div className="hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={b.id}
          className="hero__slide"
          style={{ background: b.bg }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: .45 }}
        >
          <div className="hero__content">
            <motion.p
              className="hero__eyebrow"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: .08 }}
            >
              ShopKart Exclusive
            </motion.p>
            <motion.h1
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: .15 }}
            >
              {b.title}
            </motion.h1>
            <motion.p
              className="hero__sub"
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: .22 }}
            >
              {b.sub}
            </motion.p>
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: .30 }}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
            >
              <Link to={`/category/${b.slug}`} className="btn btn-lg" style={{ background: 'white', color: '#111' }}>
                {b.cta} →
              </Link>
              <Link to="/products" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.15)', color: 'white', border: '1.5px solid rgba(255,255,255,.3)' }}>
                Browse All
              </Link>
            </motion.div>
          </div>

          <motion.div
            className="hero__image"
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {b.img}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <div className="hero__dots">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            className={`hero__dot${i === current ? ' active' : ''}`}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loadingF, setLoadingF] = useState(true);
  const [loadingT, setLoadingT] = useState(true);

  useEffect(() => {
    api.get('/products?featured=1&limit=8')
      .then(r => setFeatured(r.data.data))
      .catch(() => {})
      .finally(() => setLoadingF(false));

    api.get('/products?trending=1&limit=8')
      .then(r => setTrending(r.data.data))
      .catch(() => {})
      .finally(() => setLoadingT(false));
  }, []);

  return (
    <div className="home">
      <HeroBanner />

      {/* Flash Sale */}
      <FlashSale />

      {/* Offer Strip */}
      <section className="offer-strip">
        <div className="container">
          <div className="offer-grid">
            {OFFERS.map((o, i) => (
              <motion.div
                key={i}
                className="offer-item"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="offer-icon-wrap" style={{ background: o.bg }}>
                  <span>{o.icon}</span>
                </div>
                <div>
                  <strong>{o.title}</strong>
                  <p>{o.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="home-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Shop by Category</h2>
            <Link to="/products" className="section-link">View All →</Link>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, scale: .9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/category/${cat.slug}`}
                  className="category-card"
                  style={{ '--cat-color': cat.color }}
                >
                  <div className="category-card__icon">{cat.icon}</div>
                  <span>{cat.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="home-section home-section--alt">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Products</h2>
            <Link to="/products?featured=1" className="section-link">See All →</Link>
          </div>
          <div className="products-grid">
            {loadingF
              ? Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
              : featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
            }
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="promo-banner">
        <div className="container">
          <motion.div
            className="promo-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="promo-content">
              <p className="promo-eyebrow">🎉 Limited Time Offer</p>
              <h2>₹500 off your first order!</h2>
              <p>New to ShopKart? Use this code at checkout.</p>
              <div className="promo-code">FIRST500</div>
              <Link
                to="/products"
                className="btn btn-lg"
                style={{ marginTop: 20, background: 'white', color: 'var(--brand)', fontWeight: 700 }}
              >
                Shop Now →
              </Link>
            </div>
            <div className="promo-decoration">🎁</div>
          </motion.div>
        </div>
      </section>

      {/* Trending */}
      <section className="home-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">🔥 Trending Now</h2>
            <Link to="/products?trending=1" className="section-link">See All →</Link>
          </div>
          <div className="products-grid">
            {loadingT
              ? Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
              : trending.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
            }
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="home-section home-section--alt" style={{ textAlign: 'center', padding: '52px 20px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 style={{ marginBottom: 8, fontSize: '1.4rem' }}>Can't find what you're looking for?</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Browse our full catalog of millions of products.</p>
          <Link to="/products" className="btn btn-outline btn-lg">Browse All Products</Link>
        </motion.div>
      </section>
    </div>
  );
}
