import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../ctx/AuthContext';
import './Auth.css';

const PERKS = [
  ['🚀', 'Free delivery on orders above ₹499'],
  ['🔒', '100% secure payments'],
  ['🔄', 'Easy 7-day returns'],
  ['🎁', 'Exclusive member offers & early access'],
  ['📦', 'Track orders in real-time'],
];

export default function Login() {
  const { sendOtp, verifyOtp, adminLogin, loading } = useAuth();
  const navigate = useNavigate();

  const [tab,   setTab]   = useState('otp');
  const [step,  setStep]  = useState(1);
  const [isNew, setIsNew] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp,   setOtp]   = useState(['','','','','','']);
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError] = useState('');
  const otpRefs = useRef([]);

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(phone)) { setError('Enter a valid 10-digit phone number'); return; }
    try {
      const data = await sendOtp(phone);
      setIsNew(data.isNewUser);
      setStep(2);
    } catch (err) { setError(err.response?.data?.message || 'Failed to send OTP'); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    const code = otp.join('');
    if (code.length < 6) { setError('Enter the complete 6-digit OTP'); return; }
    if (isNew && !name.trim()) { setError('Please enter your full name'); return; }
    try {
      await verifyOtp(phone, code, name);
      navigate('/');
    } catch (err) { setError(err.response?.data?.message || 'Invalid OTP. Try again.'); }
  };

  const handleOtpInput = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    // Auto-submit when all 6 digits entered
    if (val && idx === 5 && next.every(d => d)) {
      setTimeout(() => {
        const form = document.getElementById('otp-form');
        form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }, 80);
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0)  otpRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await adminLogin(email, password);
      navigate('/admin');
    } catch (err) { setError(err.response?.data?.message || 'Invalid credentials'); }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left */}
        <div className="auth-left">
          <div className="auth-brand">
            <div className="auth-logo" aria-hidden="true">S</div>
            <h2>ShopKart</h2>
          </div>
          <h1>India's Best Online Shopping Experience</h1>
          <ul className="auth-perks">
            {PERKS.map(([icon, text]) => (
              <li key={text}>
                <span aria-hidden="true">{icon}</span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Right */}
        <div className="auth-right">
          {/* Tabs */}
          <div className="auth-tabs" role="tablist">
            <button
              className={`auth-tab${tab === 'otp' ? ' active' : ''}`}
              onClick={() => { setTab('otp'); setError(''); }}
              role="tab"
              aria-selected={tab === 'otp'}
            >
              📱 Login with OTP
            </button>
            <button
              className={`auth-tab${tab === 'admin' ? ' active' : ''}`}
              onClick={() => { setTab('admin'); setError(''); }}
              role="tab"
              aria-selected={tab === 'admin'}
            >
              ⚙️ Admin Login
            </button>
          </div>

          <AnimatePresence mode="wait">
            {tab === 'otp' ? (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: .2 }}
              >
                {step === 1 ? (
                  <form onSubmit={handleSendOtp} className="auth-form">
                    <h2>Welcome!</h2>
                    <p className="auth-sub">Enter your phone number to sign in or create an account.</p>

                    <div className="form-group">
                      <label className="label" htmlFor="phone-input">Mobile Number</label>
                      <div className="phone-input-wrap">
                        <span className="phone-prefix">🇮🇳 +91</span>
                        <input
                          id="phone-input"
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="10-digit number"
                          value={phone}
                          onChange={e => setPhone(e.target.value.replace(/\D/g,''))}
                          className="input phone-input"
                          autoFocus
                          autoComplete="tel"
                        />
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.p className="auth-error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                          ⚠ {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%' }}
                      disabled={loading || phone.length < 10}
                    >
                      {loading ? <span className="spinner" /> : 'Get OTP →'}
                    </button>

                    <p className="auth-note">
                      By continuing, you agree to our{' '}
                      <Link to="/terms">Terms of Service</Link> and{' '}
                      <Link to="/privacy">Privacy Policy</Link>.
                    </p>
                  </form>
                ) : (
                  <form id="otp-form" onSubmit={handleVerifyOtp} className="auth-form">
                    <h2>{isNew ? '🎉 Create Account' : 'Verify OTP'}</h2>
                    <p className="auth-sub">
                      Code sent to +91 {phone}
                      <button type="button" className="edit-phone" onClick={() => { setStep(1); setOtp(['','','','','','']); setError(''); }}>
                        Change
                      </button>
                    </p>

                    {isNew && (
                      <div className="form-group">
                        <label className="label" htmlFor="name-input">Your Full Name</label>
                        <input
                          id="name-input"
                          type="text"
                          placeholder="e.g. Priya Sharma"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="input"
                          autoFocus
                          autoComplete="name"
                        />
                      </div>
                    )}

                    <div className="form-group">
                      <label className="label">Enter 6-digit OTP</label>
                      <div className="otp-inputs" onPaste={handleOtpPaste} role="group" aria-label="OTP input">
                        {otp.map((d, i) => (
                          <input
                            key={i}
                            ref={el => otpRefs.current[i] = el}
                            id={`otp-${i}`}
                            type="tel"
                            inputMode="numeric"
                            maxLength={1}
                            value={d}
                            onChange={e => handleOtpInput(i, e.target.value)}
                            onKeyDown={e => handleOtpKeyDown(e, i)}
                            className="otp-box"
                            aria-label={`OTP digit ${i + 1}`}
                            autoFocus={i === 0 && !isNew}
                            autoComplete="one-time-code"
                          />
                        ))}
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.p className="auth-error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                          ⚠ {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%' }}
                      disabled={loading}
                    >
                      {loading ? <span className="spinner" /> : isNew ? 'Create Account →' : 'Verify & Login →'}
                    </button>

                    <button
                      type="button"
                      className="resend-otp"
                      onClick={handleSendOtp}
                    >
                      Didn't get the OTP? Resend
                    </button>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="admin"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: .2 }}
              >
                <form onSubmit={handleAdminLogin} className="auth-form">
                  <h2>Admin Login</h2>
                  <p className="auth-sub">Access the ShopKart admin dashboard.</p>

                  <div className="form-group">
                    <label className="label" htmlFor="admin-email">Email Address</label>
                    <input
                      id="admin-email"
                      type="email"
                      placeholder="admin@shopkart.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="input"
                      autoComplete="username"
                    />
                  </div>

                  <div className="form-group">
                    <label className="label" htmlFor="admin-pwd">Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="admin-pwd"
                        type={showPwd ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="input"
                        style={{ paddingRight: 48 }}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                        aria-label={showPwd ? 'Hide password' : 'Show password'}
                      >
                        {showPwd ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p className="auth-error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                        ⚠ {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%' }}
                    disabled={loading}
                  >
                    {loading ? <span className="spinner" /> : 'Sign In →'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
