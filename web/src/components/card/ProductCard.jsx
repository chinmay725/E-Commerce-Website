import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../../ctx/CartContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import './ProductCard.css';

const Stars = ({ rating }) => {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <div className="stars" aria-label={`${rating} out of 5 stars`}>
      {[...Array(full)].map((_,i)  => <span key={`f${i}`} className="star">★</span>)}
      {half === 1                   && <span className="star half">★</span>}
      {[...Array(empty)].map((_,i) => <span key={`e${i}`} className="star empty">★</span>)}
    </div>
  );
};

export default function ProductCard({ product, index = 0 }) {
  const { addToCart }           = useCart();
  const [inWishlist, setInWishlist] = useState(false);
  const [adding, setAdding]         = useState(false);
  const [imgError, setImgError]     = useState(false);

  const discount = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const handleAddToCart = async (e) => {
    console.log('[ProductCard] handleAddToCart called for product id:', product.id);
    e.preventDefault(); e.stopPropagation();
    if (product.stock === 0) {
      console.log('[ProductCard] Product out of stock:', product.id);
      return;
    }
    setAdding(true);
    console.log('[ProductCard] Calling addToCart from useCart...');
    const result = await addToCart(product);
    console.log('[ProductCard] addToCart result:', result);
    setAdding(false);
  };

  const handleWishlist = async (e) => {
    e.preventDefault(); e.stopPropagation();
    try {
      if (inWishlist) {
        await api.delete(`/users/wishlist/${product.id}`);
        toast.success('Removed from wishlist');
      } else {
        await api.post('/users/wishlist', { product_id: product.id });
        toast.success('Added to wishlist ❤️');
      }
      setInWishlist(!inWishlist);
    } catch {
      toast.error('Please login to use wishlist');
    }
  };

  return (
    <motion.article
      className="product-card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.28 }}
    >
      <Link to={`/product/${product.slug}`} className="product-card__link" aria-label={product.name}>
        {/* Image */}
        <div className="product-card__image-wrap">
          <img
            src={!imgError ? (product.thumbnail_url || '/placeholder.png') : '/placeholder.png'}
            alt={product.name}
            className="product-card__image"
            onError={() => setImgError(true)}
            loading="lazy"
            decoding="async"
          />

          {discount >= 5 && (
            <div className="product-card__badge" aria-label={`${discount}% discount`}>
              {discount}% OFF
            </div>
          )}

          {product.stock === 0 && (
            <div className="product-card__oos" aria-label="Out of stock">Out of Stock</div>
          )}

          {/* Wishlist Action */}
          <div className="product-card__actions">
            <motion.button
              className={`wishlist-btn${inWishlist ? ' active' : ''}`}
              onClick={handleWishlist}
              whileTap={{ scale: 0.82 }}
              aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {inWishlist ? '❤️' : '🤍'}
            </motion.button>
          </div>
        </div>

        {/* Info */}
        <div className="product-card__body">
          {product.brand_name && (
            <p className="product-card__brand">{product.brand_name}</p>
          )}
          <h3 className="product-card__name line-clamp-2">{product.name}</h3>

          {product.avg_rating > 0 && (
            <div className="product-card__rating">
              <Stars rating={product.avg_rating} />
              <span className="rating-count">({product.review_count?.toLocaleString('en-IN')})</span>
            </div>
          )}

          <div className="product-card__price">
            <span className="price-main">₹{product.price?.toLocaleString('en-IN')}</span>
            {product.mrp && product.mrp > product.price && (
              <span className="price-mrp">₹{product.mrp?.toLocaleString('en-IN')}</span>
            )}
            {discount >= 5 && (
              <span className="price-off">{discount}% off</span>
            )}
          </div>

          {product.stock > 0 && product.stock <= 5 && (
            <p className="low-stock">⚡ Only {product.stock} left</p>
          )}
        </div>
      </Link>

      {/* Add to Cart */}
      <div className="product-card__footer">
        <motion.button
          className={`btn btn-primary btn-sm add-cart-btn${adding ? ' loading' : ''}`}
          onClick={handleAddToCart}
          disabled={product.stock === 0 || adding}
          whileTap={{ scale: 0.96 }}
          aria-label={product.stock === 0 ? 'Out of stock' : `Add ${product.name} to cart`}
        >
          {adding ? (
            <span className="spinner" aria-hidden="true" />
          ) : product.stock === 0 ? (
            'Out of Stock'
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              Add to Cart
            </>
          )}
        </motion.button>
      </div>
    </motion.article>
  );
}

// ── Skeleton ──────────────────────────────────────────
export function ProductCardSkeleton() {
  return (
    <div className="product-card product-card--skeleton" aria-hidden="true">
      <div className="skeleton" style={{ aspectRatio: '1', borderRadius: 'var(--r-md) var(--r-md) 0 0' }} />
      <div className="product-card__body" style={{ gap: 8 }}>
        <div className="skeleton" style={{ height: 11, width: '45%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 15, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 15, width: '75%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 12, width: '55%', borderRadius: 4, marginTop: 4 }} />
        <div className="skeleton" style={{ height: 20, width: '40%', borderRadius: 4 }} />
      </div>
      <div className="product-card__footer">
        <div className="skeleton" style={{ height: 38, borderRadius: 'var(--r)' }} />
      </div>
    </div>
  );
}
