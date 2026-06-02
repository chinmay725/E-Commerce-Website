import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard, { ProductCardSkeleton } from '../components/card/ProductCard';
import api from '../lib/api';
import './Products.css';

// SVG Icons
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="11" y1="18" x2="13" y2="18" />
  </svg>
);

const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const StoreIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const FireIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First', icon: <ClockIcon /> },
  { value: 'price',      label: 'Price: Low to High', icon: <ArrowUpIcon /> },
  { value: 'price|DESC', label: 'Price: High to Low', icon: <ArrowDownIcon /> },
  { value: 'rating',     label: 'Top Rated', icon: <StarIcon /> },
  { value: 'popular',    label: 'Most Popular', icon: <FireIcon /> },
];

const PRICE_PRESETS = [
  ['Under 500', '', '500'],
  ['500 – 2,000', '500', '2000'],
  ['2,000 – 10,000', '2000', '10000'],
  ['10,000+', '10000', ''],
];

export default function Products({ categorySlug }) {
  const [params, setParams] = useSearchParams();
  const [products, setProducts]     = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]       = useState(true);
  const [categories, setCategories] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    search:   params.get('search')   || '',
    category: categorySlug || params.get('category') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    sort:     params.get('sort')     || 'newest',
    page:     parseInt(params.get('page')) || 1,
    featured: params.get('featured') || '',
    trending: params.get('trending') || '',
  });

  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data)).catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      update('search', searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [sortField, sortOrder] = filters.sort.split('|');
      const q = new URLSearchParams();
      if (filters.search)   q.set('search',   filters.search);
      if (filters.category) q.set('category', filters.category);
      if (filters.minPrice) q.set('minPrice', filters.minPrice);
      if (filters.maxPrice) q.set('maxPrice', filters.maxPrice);
      if (filters.featured) q.set('featured', '1');
      if (filters.trending) q.set('trending', '1');
      q.set('sort', sortField);
      q.set('order', sortOrder || 'DESC');
      q.set('page', filters.page);
      q.set('limit', '20');

      const { data } = await api.get(`/products?${q}`);
      setProducts(data.data);
      setPagination(data.pagination);
    } catch {} finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const update = (key, val) => setFilters(f => ({ ...f, [key]: val, page: key !== 'page' ? 1 : val }));
  const clearAll = () => {
    setFilters({ search:'', category:'', minPrice:'', maxPrice:'', sort:'newest', page:1, featured:'', trending:'' });
    setSearchInput('');
  };

  const activeCount = [filters.category, filters.minPrice, filters.maxPrice, filters.featured, filters.trending].filter(Boolean).length;

  return (
    <div className="products-page page-wrapper">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span className="sep">›</span>
          <span>{filters.category ? filters.category.charAt(0).toUpperCase() + filters.category.slice(1) : 'All Products'}</span>
        </div>

        <div className="products-layout">
          {/* Sidebar */}
          <aside className={`products-sidebar${filterOpen ? ' open' : ''}`}>
            <div className="sidebar-header">
              <h3>
                Filters {activeCount > 0 && <span className="badge badge-brand" style={{ marginLeft: 6, verticalAlign: 'middle' }}>{activeCount}</span>}
              </h3>
              {activeCount > 0 && <button className="sidebar-reset" onClick={clearAll}>Clear all</button>}
            </div>

            {/* Categories */}
            <div className="sidebar-section">
              <h4>Category</h4>
              <div className="sidebar-cats">
                <button
                  className={`sidebar-cat-btn${!filters.category ? ' active' : ''}`}
                  onClick={() => update('category', '')}
                  aria-label="All categories"
                >
                  <StoreIcon /> All Products
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.slug}
                    className={`sidebar-cat-btn${filters.category === cat.slug ? ' active' : ''}`}
                    onClick={() => update('category', cat.slug)}
                  >
                    <span>{cat.icon || '📦'}</span> {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="sidebar-section">
              <h4>Price Range</h4>
              <div className="price-inputs" style={{ marginBottom: 12 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number" placeholder="Min"
                    value={filters.minPrice}
                    onChange={e => update('minPrice', e.target.value)}
                    aria-label="Minimum price"
                  />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 12 }}>₹</span>
                </div>
                <span className="price-sep">—</span>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number" placeholder="Max"
                    value={filters.maxPrice}
                    onChange={e => update('maxPrice', e.target.value)}
                    aria-label="Maximum price"
                  />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 12 }}>₹</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PRICE_PRESETS.map(([label, min, max]) => (
                  <button
                    key={label}
                    className={`tag${filters.minPrice === min && filters.maxPrice === max ? ' active' : ''}`}
                    onClick={() => setFilters(f => ({ ...f, minPrice: min, maxPrice: max, page: 1 }))}
                    style={{ fontSize: 11 }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Filters */}
            <div className="sidebar-section">
              <h4>Quick Filters</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['featured', 'Featured', filters.featured, <StarIcon />],
                  ['trending', 'Trending', filters.trending, <FireIcon />],
                ].map(([key, label, val, icon]) => (
                  <div key={key} className="toggle-row">
                    <label htmlFor={`tog-${key}`} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <button
                        id={`tog-${key}`}
                        className={`toggle${val ? ' on' : ''}`}
                        onClick={() => update(key, val ? '' : '1')}
                        role="switch"
                        aria-checked={!!val}
                        aria-label={label}
                      />
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {icon} {label}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="products-main">
            <div className="products-toolbar">
              {/* Search Input */}
              <div className="search-wrapper">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  aria-label="Search products"
                />
                {searchInput && (
                  <button
                    className="search-clear"
                    onClick={() => setSearchInput('')}
                    aria-label="Clear search"
                  >
                    <XIcon />
                  </button>
                )}
              </div>

              <p className="products-count">
                {loading ? 'Loading…' : <><strong>{pagination.total || 0}</strong> products</>}
              </p>
              <button
                className="filter-toggle-btn"
                onClick={() => setFilterOpen(!filterOpen)}
                aria-expanded={filterOpen}
                aria-label="Toggle filters"
              >
                <FilterIcon />
                Filters {activeCount > 0 && <span className="filter-count">{activeCount}</span>}
              </button>
              <select
                className="sort-select"
                value={filters.sort}
                onChange={e => update('sort', e.target.value)}
                aria-label="Sort products"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Active filter tags */}
            {(filters.search || filters.category || filters.minPrice || filters.maxPrice) && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                {filters.search && (
                  <span className="tag active" onClick={() => { update('search', ''); setSearchInput(''); }} style={{ cursor: 'pointer' }}>
                    Search: "{filters.search}" <XIcon />
                  </span>
                )}
                {filters.category && (
                  <span className="tag active" onClick={() => update('category', '')} style={{ cursor: 'pointer' }}>
                    {filters.category} ✕
                  </span>
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <span className="tag active" onClick={() => setFilters(f => ({ ...f, minPrice: '', maxPrice: '' }))} style={{ cursor: 'pointer' }}>
                    ₹{filters.minPrice || '0'} – ₹{filters.maxPrice || '∞'} <XIcon />
                  </span>
                )}
              </div>
            )}

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" className="products-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {Array(12).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
                </motion.div>
              ) : products.length === 0 ? (
                <motion.div key="empty" className="no-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="no-results-icon"><SearchIcon /></div>
                  <h3>No products found</h3>
                  <p>Try adjusting your filters or search term.</p>
                  <button className="btn btn-primary" onClick={clearAll}>Clear All Filters</button>
                </motion.div>
              ) : (
                <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="products-grid">
                    {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                  </div>

                  {pagination.pages > 1 && (
                    <div className="pagination">
                      <button
                        className="page-btn" disabled={!pagination.hasPrev}
                        onClick={() => update('page', filters.page - 1)}
                      >← Prev</button>
                      {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => (
                        <button
                          key={i + 1}
                          className={`page-btn${i + 1 === filters.page ? ' active' : ''}`}
                          onClick={() => update('page', i + 1)}
                        >{i + 1}</button>
                      ))}
                      <button
                        className="page-btn" disabled={!pagination.hasNext}
                        onClick={() => update('page', filters.page + 1)}
                      >Next →</button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
