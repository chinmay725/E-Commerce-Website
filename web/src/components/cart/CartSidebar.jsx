import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../ctx/CartContext';
import './CartSidebar.css';

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

export default function CartSidebar() {
  const { cart, cartOpen, setCartOpen, updateQuantity, removeItem } = useCart();

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            className="cart-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: .2 }}
            onClick={() => setCartOpen(false)}
            aria-hidden="true"
          />
          <motion.aside
            className="cart-sidebar"
            role="dialog"
            aria-label="Shopping cart"
            aria-modal="true"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          >
            {/* Header */}
            <div className="cart-header">
              <div>
                <h3>Shopping Cart</h3>
                <span className="cart-count">
                  {cart.itemCount === 0
                    ? 'No items'
                    : `${cart.itemCount} item${cart.itemCount !== 1 ? 's' : ''}`}
                </span>
              </div>
              <button
                className="cart-close"
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
              >✕</button>
            </div>

            {/* Items */}
            <div className="cart-items">
              {cart.items.length === 0 ? (
                <div className="cart-empty">
                  <div className="cart-empty-icon" aria-hidden="true">🛍️</div>
                  <p>Your cart is empty</p>
                  <Link
                    to="/products"
                    className="btn btn-primary"
                    onClick={() => setCartOpen(false)}
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {cart.items.map(item => (
                    <motion.div
                      key={item.id}
                      className="cart-item"
                      layout
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24, height: 0, paddingTop: 0, paddingBottom: 0 }}
                      transition={{ duration: .22 }}
                    >
                      <Link
                        to={`/product/${item.slug}`}
                        onClick={() => setCartOpen(false)}
                        aria-label={`View ${item.name}`}
                        tabIndex={0}
                      >
                        <img
                          src={item.thumbnail_url || '/placeholder.png'}
                          alt={item.name}
                          width="72"
                          height="72"
                          loading="lazy"
                          onError={e => { e.target.src = '/placeholder.png'; }}
                        />
                      </Link>

                      <div className="cart-item__info">
                        <p className="cart-item__name">{item.name}</p>
                        <p className="cart-item__price">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                        {item.mrp && item.mrp > item.price && (
                          <p style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>
                            Save ₹{((item.mrp - item.price) * item.quantity).toLocaleString('en-IN')}
                          </p>
                        )}
                        <div className="cart-item__qty">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >−</button>
                          <span aria-live="polite">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= (item.stock || 99)}
                            aria-label="Increase quantity"
                          >+</button>
                          <button
                            className="cart-item__remove"
                            onClick={() => removeItem(item.id)}
                            aria-label={`Remove ${item.name}`}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {cart.items.length > 0 && (
              <div className="cart-footer">
                {cart.savings > 0 && (
                  <motion.div
                    className="cart-savings"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    🎉 You're saving ₹{cart.savings?.toLocaleString('en-IN')}!
                  </motion.div>
                )}

                <div className="cart-totals">
                  <div className="total-row">
                    <span>Subtotal ({cart.itemCount} items)</span>
                    <span>₹{cart.subtotal?.toLocaleString('en-IN')}</span>
                  </div>
                  {cart.savings > 0 && (
                    <div className="total-row" style={{ color: 'var(--success)' }}>
                      <span>Discount</span>
                      <span>− ₹{cart.savings?.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="total-row">
                    <span>Delivery</span>
                    <span>
                      {cart.shipping === 0
                        ? <span className="text-success fw-bold">FREE</span>
                        : `₹${cart.shipping?.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <div className="total-row total-row--final">
                    <strong>Grand Total</strong>
                    <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--brand)' }}>
                      ₹{cart.total?.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setCartOpen(false)}
                >
                  Checkout →
                </Link>
                <Link
                  to="/cart"
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                  onClick={() => setCartOpen(false)}
                >
                  View Full Cart
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
