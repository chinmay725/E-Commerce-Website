import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../ctx/CartContext';
import { useAuth } from '../ctx/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './Checkout.css';

const PAYMENT_METHODS = [
  { id: 'cod',        icon: '💵', label: 'Cash on Delivery',   sub: 'Pay when your order arrives' },
  { id: 'upi',        icon: '📱', label: 'UPI',                sub: 'GPay, PhonePe, Paytm & more' },
  { id: 'card',       icon: '💳', label: 'Credit / Debit Card',sub: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking', icon: '🏦', label: 'Net Banking',         sub: 'All major Indian banks' },
];

const STEPS = ['Cart', 'Address', 'Payment', 'Review'];

export default function Checkout() {
  const { cart, clearCart }   = useCart();
  const { user }              = useAuth();
  const navigate              = useNavigate();
  const [step, setStep]       = useState(0);   // 0=address, 1=payment, 2=review
  const [addresses, setAddresses]   = useState([]);
  const [selAddress, setSelAddress] = useState(null);
  const [payment, setPayment]       = useState('cod');
  const [newAddrOpen, setNewAddrOpen] = useState(false);
  const [placing, setPlacing]       = useState(false);
  const [placed, setPlaced]         = useState(false);
  const [orderId, setOrderId]       = useState(null);
  const [addrForm, setAddrForm]     = useState({
    label: 'Home', full_name: '', phone: '',
    line1: '', line2: '', city: '', state: '', pincode: '',
  });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get('/users/addresses').then(r => {
      setAddresses(r.data.data || []);
      const def = r.data.data?.find(a => a.is_default) || r.data.data?.[0];
      if (def) setSelAddress(def.id);
      else setNewAddrOpen(true);
    }).catch(() => setNewAddrOpen(true));
  }, [user]);

  const setAddrField = (k, v) => setAddrForm(f => ({ ...f, [k]: v }));

  const saveAddress = async () => {
    const req = ['full_name', 'phone', 'line1', 'city', 'state', 'pincode'];
    const missing = req.filter(k => !addrForm[k].trim());
    if (missing.length) { toast.error('Please fill all required fields'); return; }
    try {
      await api.post('/users/addresses', { ...addrForm, is_default: 1 });
      const { data } = await api.get('/users/addresses');
      setAddresses(data.data);
      setSelAddress(data.data[0]?.id);
      setNewAddrOpen(false);
      toast.success('Address saved!');
    } catch { toast.error('Failed to save address'); }
  };

  const placeOrder = async () => {
    if (!selAddress) { toast.error('Please select a delivery address'); return; }
    setPlacing(true);
    try {
      const { data } = await api.post('/orders', {
        address_id: selAddress,
        payment_method: payment,
      });
      setOrderId(data.data?.order_number || data.order?.order_number);
      setPlaced(true);
      await clearCart?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to place order');
    } finally { setPlacing(false); }
  };

  const gst = Math.round((cart.subtotal || 0) * 0.18);
  const grandTotal = (cart.total || 0) + gst;

  if (placed) return (
    <div className="page-wrapper checkout-success">
      <motion.div
        className="success-card"
        initial={{ scale: .8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <motion.div
          className="success-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: .2, type: 'spring', damping: 14 }}
        >
          ✓
        </motion.div>
        <h2>Order Placed!</h2>
        {orderId && <p className="order-num">Order #{orderId}</p>}
        <p className="success-msg">
          Your order has been placed successfully. We'll send you updates at every step.
        </p>
        <div className="success-actions">
          <Link to="/orders" className="btn btn-primary btn-lg">Track My Order</Link>
          <Link to="/" className="btn btn-secondary btn-lg">Continue Shopping</Link>
        </div>
      </motion.div>
    </div>
  );

  if (!cart.items?.length && !placing) return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', flexDirection: 'column', gap: 16, textAlign: 'center', padding: 20 }}>
      <div style={{ fontSize: 64 }}>🛒</div>
      <h2>Your cart is empty</h2>
      <Link to="/products" className="btn btn-primary btn-lg">Browse Products</Link>
    </div>
  );

  const selectedAddr = addresses.find(a => a.id === selAddress);

  return (
    <div className="page-wrapper checkout-page">
      <div className="container">
        {/* Progress */}
        <div className="checkout-progress">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`checkout-step${i <= step + 1 ? ' done' : ''}${i === step + 1 ? ' active' : ''}`}>
                <div className="step-dot">{i < step + 1 ? '✓' : i + 1}</div>
                <span>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`step-line${i < step + 1 ? ' done' : ''}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="checkout-layout">
          {/* Left */}
          <div className="checkout-left">

            {/* Address Section */}
            <div className={`checkout-section${step === 0 ? ' active' : ''}`}>
              <div className="section-head" onClick={() => setStep(0)}>
                <div className="section-num">1</div>
                <h3>Delivery Address</h3>
                {step > 0 && selectedAddr && (
                  <span className="section-summary">
                    {selectedAddr.full_name}, {selectedAddr.city}
                  </span>
                )}
              </div>

              <AnimatePresence>
                {step === 0 && (
                  <motion.div
                    className="section-body"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="addr-list">
                      {addresses.map(addr => (
                        <label
                          key={addr.id}
                          className={`addr-card${selAddress === addr.id ? ' selected' : ''}`}
                        >
                          <input
                            type="radio" name="addr"
                            checked={selAddress === addr.id}
                            onChange={() => setSelAddress(addr.id)}
                            className="sr-only"
                          />
                          <div className="addr-card__radio" aria-hidden="true">
                            {selAddress === addr.id ? '●' : '○'}
                          </div>
                          <div className="addr-card__body">
                            <div className="addr-card__top">
                              <strong>{addr.full_name}</strong>
                              <span className="addr-label">{addr.label}</span>
                            </div>
                            <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                            <p>{addr.city}, {addr.state} – {addr.pincode}</p>
                            <p className="addr-phone">📱 {addr.phone}</p>
                          </div>
                        </label>
                      ))}

                      <button
                        className="btn btn-secondary btn-sm add-addr-btn"
                        onClick={() => setNewAddrOpen(!newAddrOpen)}
                      >
                        {newAddrOpen ? '✕ Cancel' : '+ Add New Address'}
                      </button>
                    </div>

                    <AnimatePresence>
                      {newAddrOpen && (
                        <motion.div
                          className="addr-form"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <div className="addr-form-grid">
                            {[
                              ['Full Name *', 'full_name', 'text'],
                              ['Phone Number *', 'phone', 'tel'],
                              ['Address Line 1 *', 'line1', 'text'],
                              ['Address Line 2', 'line2', 'text'],
                              ['City *', 'city', 'text'],
                              ['State *', 'state', 'text'],
                            ].map(([label, key, type]) => (
                              <div key={key} className="form-group">
                                <label className="label">{label}</label>
                                <input
                                  type={type} className="input"
                                  value={addrForm[key]}
                                  onChange={e => setAddrField(key, e.target.value)}
                                  placeholder={label.replace(' *', '')}
                                />
                              </div>
                            ))}
                            <div className="form-group">
                              <label className="label">Pincode *</label>
                              <input
                                type="text" className="input" maxLength={6}
                                value={addrForm.pincode}
                                onChange={e => setAddrField('pincode', e.target.value.replace(/\D/g, ''))}
                                placeholder="6-digit pincode"
                              />
                            </div>
                            <div className="form-group">
                              <label className="label">Address Label</label>
                              <select className="input" value={addrForm.label} onChange={e => setAddrField('label', e.target.value)}>
                                {['Home', 'Work', 'Other'].map(l => <option key={l}>{l}</option>)}
                              </select>
                            </div>
                          </div>
                          <button className="btn btn-primary btn-sm" onClick={saveAddress} style={{ marginTop: 12 }}>
                            Save & Use This Address
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      className="btn btn-primary"
                      style={{ marginTop: 16 }}
                      disabled={!selAddress}
                      onClick={() => setStep(1)}
                    >
                      Deliver Here →
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Payment Section */}
            <div className={`checkout-section${step === 1 ? ' active' : ''}${step < 1 ? ' locked' : ''}`}>
              <div className="section-head" onClick={() => step > 0 && setStep(1)}>
                <div className="section-num">2</div>
                <h3>Payment Method</h3>
                {step > 1 && <span className="section-summary">{PAYMENT_METHODS.find(p => p.id === payment)?.label}</span>}
              </div>

              <AnimatePresence>
                {step === 1 && (
                  <motion.div
                    className="section-body"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="payment-list">
                      {PAYMENT_METHODS.map(pm => (
                        <label
                          key={pm.id}
                          className={`payment-card${payment === pm.id ? ' selected' : ''}`}
                        >
                          <input
                            type="radio" name="payment"
                            checked={payment === pm.id}
                            onChange={() => setPayment(pm.id)}
                            className="sr-only"
                          />
                          <span className="payment-icon">{pm.icon}</span>
                          <div>
                            <strong>{pm.label}</strong>
                            <span>{pm.sub}</span>
                          </div>
                          <div className={`payment-radio${payment === pm.id ? ' on' : ''}`} aria-hidden="true" />
                        </label>
                      ))}
                    </div>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setStep(2)}>
                      Continue →
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Review & Place */}
            <div className={`checkout-section${step === 2 ? ' active' : ''}${step < 2 ? ' locked' : ''}`}>
              <div className="section-head" onClick={() => step > 1 && setStep(2)}>
                <div className="section-num">3</div>
                <h3>Review & Place Order</h3>
              </div>

              <AnimatePresence>
                {step === 2 && (
                  <motion.div
                    className="section-body"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="review-items">
                      {cart.items.map(item => (
                        <div key={item.id} className="review-item">
                          <img src={item.thumbnail_url || '/placeholder.png'} alt={item.name} />
                          <div className="review-item__info">
                            <p>{item.name}</p>
                            <span>Qty: {item.quantity}</span>
                          </div>
                          <strong>₹{(item.price * item.quantity)?.toLocaleString('en-IN')}</strong>
                        </div>
                      ))}
                    </div>

                    <motion.button
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: 16 }}
                      onClick={placeOrder}
                      disabled={placing}
                      whileTap={{ scale: .98 }}
                    >
                      {placing ? (
                        <><span className="spinner" /> Placing Order…</>
                      ) : (
                        `🛒 Place Order · ₹${grandTotal.toLocaleString('en-IN')}`
                      )}
                    </motion.button>
                    <p className="secure-note">🔒 Your payment info is 100% secure and encrypted.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right – Summary */}
          <aside className="checkout-summary">
            <div className="summary-card">
              <h3>Order Summary</h3>
              <div className="summary-items">
                {cart.items.map(item => (
                  <div key={item.id} className="summary-item">
                    <img src={item.thumbnail_url || '/placeholder.png'} alt={item.name} />
                    <div className="summary-item__info">
                      <p className="line-clamp-2">{item.name}</p>
                      <span>× {item.quantity}</span>
                    </div>
                    <strong>₹{(item.price * item.quantity)?.toLocaleString('en-IN')}</strong>
                  </div>
                ))}
              </div>

              <div className="summary-totals">
                <div className="sum-row">
                  <span>Subtotal ({cart.itemCount} items)</span>
                  <span>₹{cart.subtotal?.toLocaleString('en-IN')}</span>
                </div>
                <div className="sum-row">
                  <span>Shipping</span>
                  <span className={cart.shipping === 0 ? 'text-success' : ''}>
                    {cart.shipping === 0 ? 'FREE' : `₹${cart.shipping}`}
                  </span>
                </div>
                {cart.savings > 0 && (
                  <div className="sum-row" style={{ color: 'var(--success)' }}>
                    <span>Discount</span>
                    <span>−₹{cart.savings?.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="sum-row">
                  <span>GST (18%)</span>
                  <span>₹{gst.toLocaleString('en-IN')}</span>
                </div>
                <div className="sum-row sum-row--total">
                  <strong>Total</strong>
                  <strong>₹{grandTotal.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {cart.savings > 0 && (
                <div className="savings-notice">
                  🎉 You save ₹{cart.savings?.toLocaleString('en-IN')} on this order!
                </div>
              )}
            </div>

            <div className="trust-badges">
              {[['🔒','Secure Checkout'],['🚀','Fast Delivery'],['🔄','Easy Returns']].map(([icon, text]) => (
                <div key={text} className="trust-badge">
                  <span>{icon}</span> {text}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
