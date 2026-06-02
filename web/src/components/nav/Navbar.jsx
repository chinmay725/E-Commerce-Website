import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../ctx/AuthContext';
import { useCart } from '../../ctx/CartContext';
import api from '../../lib/api';
import './Navbar.css';

const categories = [
  { name: 'Mobiles',     slug: 'mobiles',     icon: '📱' },
  { name: 'Fashion',     slug: 'fashion',     icon: '👗' },
  { name: 'Electronics', slug: 'electronics', icon: '💻' },
  { name: 'Appliances',  slug: 'appliances',  icon: '🏠' },
  { name: 'Sports',      slug: 'sports',      icon: '⚽' },
  { name: 'Health',      slug: 'health',      icon: '💊' },
  { name: 'Books',       slug: 'books',       icon: '📚' },
  { name: 'Home',        slug: 'home-kitchen',icon: '🛋' },
];

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const MoonIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);
const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

export default function Navbar({ theme, toggleTheme }) {
  const { user, logout, isAdmin }       = useAuth();
  const { cart, cartOpen, setCartOpen } = useCart();
  const [query, setQuery]               = useState('');
  const [suggestions, setSuggestions]   = useState([]);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled]         = useState(false);
  const searchRef = useRef(null);
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e) => {
      if (!e.target.closest('.user-menu-wrap')) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  // Search suggestions debounce
  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/products/search/suggestions?q=${encodeURIComponent(query)}`);
        setSuggestions(data.data || []);
      } catch {}
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
      setSuggestions([]);
      setQuery('');
    }
  };

  const DROPDOWN_ITEMS = [
    { icon: '👤', label: 'My Profile',  to: '/dashboard' },
    { icon: '📦', label: 'My Orders',   to: '/orders' },
    { icon: '❤️', label: 'Wishlist',    to: '/wishlist' },
  ];

  return (
    <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`} role="banner">
      <div className="navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo" aria-label="ShopKart Home">
          <div className="logo-icon" aria-hidden="true">S</div>
          <span className="logo-text">Shop<span>Kart</span></span>
        </Link>

        {/* Search */}
        <form className="navbar__search" onSubmit={handleSearch} ref={searchRef} role="search">
          <div className="search-wrap">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="search"
              placeholder="Search products, brands…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="search-input"
              aria-label="Search products"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                className="search-clear"
                onClick={() => { setQuery(''); setSuggestions([]); }}
                aria-label="Clear search"
              >✕</button>
            )}
            <button type="submit" className="search-btn" aria-label="Search">Search</button>
          </div>

          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div
                className="suggestions"
                role="listbox"
                aria-label="Search suggestions"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: .15 }}
              >
                {suggestions.map(s => (
                  <Link
                    key={s.id}
                    to={`/product/${s.slug}`}
                    className="suggestion-item"
                    role="option"
                    onClick={() => { setSuggestions([]); setQuery(''); }}
                  >
                    <img src={s.thumbnail_url || '/placeholder.png'} alt={s.name} width="48" height="48" />
                    <div>
                      <p>{s.name}</p>
                      <span>₹{s.price?.toLocaleString('en-IN')}</span>
                    </div>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Actions */}
        <nav className="navbar__actions" aria-label="Main navigation actions">
          {/* Theme */}
          <button
            className="navbar__icon-btn theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Cart */}
          <button
            className="navbar__icon-btn cart-btn"
            onClick={() => setCartOpen(!cartOpen)}
            aria-label={`Cart, ${cart.itemCount} items`}
          >
            <CartIcon />
            {cart.itemCount > 0 && (
              <motion.span
                className="cart-badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                key={cart.itemCount}
              >
                {cart.itemCount > 9 ? '9+' : cart.itemCount}
              </motion.span>
            )}
          </button>

          {/* User */}
          {user ? (
            <div className="user-menu-wrap">
              <button
                className="user-trigger"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
              >
                <div className="user-avatar" aria-hidden="true">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="user-name">{user.name?.split(' ')[0]}</span>
                <ChevronIcon />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    className="user-dropdown"
                    role="menu"
                    initial={{ opacity: 0, y: -8, scale: .96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: .96 }}
                    transition={{ duration: .15 }}
                  >
                    <div className="dropdown-header">
                      <strong>{user.name}</strong>
                      <span>{user.phone}</span>
                    </div>
                    {DROPDOWN_ITEMS.map(item => (
                      <Link key={item.to} to={item.to} className="dropdown-item" role="menuitem">
                        <span aria-hidden="true">{item.icon}</span> {item.label}
                      </Link>
                    ))}
                    {isAdmin && (
                      <Link to="/admin" className="dropdown-item dropdown-item--admin" role="menuitem">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                        Admin Panel
                      </Link>
                    )}
                    <div className="dropdown-divider" />
                    <button className="dropdown-item dropdown-item--danger" onClick={logout} role="menuitem">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Log Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              Login
            </Link>
          )}
        </nav>

        {/* Hamburger */}
        <button
          className="hamburger"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label="Toggle menu"
        >
          <span className={mobileOpen ? 'active' : ''} />
          <span className={mobileOpen ? 'active' : ''} />
          <span className={mobileOpen ? 'active' : ''} />
        </button>
      </div>

      {/* Category Bar */}
      <nav className="category-bar" aria-label="Product categories">
        <div className="category-bar__inner">
          {categories.map(cat => (
            <Link
              key={cat.slug}
              to={`/category/${cat.slug}`}
              className={`cat-link${location.pathname === `/category/${cat.slug}` ? ' active' : ''}`}
            >
              <span aria-hidden="true">{cat.icon}</span> {cat.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: .22 }}
          >
            <div className="mobile-search">
              <form onSubmit={handleSearch}>
                <input
                  type="search"
                  placeholder="Search products…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="input"
                  aria-label="Search"
                />
              </form>
            </div>
            <div className="mobile-cats">
              {categories.map(cat => (
                <Link key={cat.slug} to={`/category/${cat.slug}`} className="mobile-cat-link">
                  <span aria-hidden="true">{cat.icon}</span>
                  {cat.name}
                </Link>
              ))}
            </div>

            {!user && (
              <div style={{ padding: '8px 16px 16px' }}>
                <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Login / Sign Up
                </Link>
              </div>
            )}
            {user && (
              <div className="mobile-user-links">
                <Link to="/dashboard">My Profile</Link>
                <Link to="/orders">My Orders</Link>
                <Link to="/wishlist">Wishlist</Link>
                {isAdmin && <Link to="/admin">Admin Panel</Link>}
                <button onClick={logout}>Log Out</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
