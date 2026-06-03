import React, { useState, useRef, useEffect, useCallback } from 'react';
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

const OTP_TIMER = 60; // seconds

/* ── Circular countdown ring ────────────────────────────── */
function CountdownRing({ seconds, total }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const progress = seconds / total;
  const dash = circ * progress;
  const color = seconds <= 10 ? '#ef4444' : '#F0522B';

  return (
    <svg className="otp-ring" width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
      {/* track */}
      <circle cx="26" cy="26" r={r} fill="none" stroke="var(--border)" strokeWidth="3" />
      {/* progress */}
      <circle
        cx="26" cy="26" r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 26 26)"
        style={{ transition: 'stroke-dasharray 1s linear, stroke .3s' }}
      />
      <text
        x="26" y="26"
        textAnchor="middle" dominantBaseline="central"
        fontSize="11" fontWeight="700"
        fill={color}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {String(Math.floor(seconds / 60)).padStart(2, '0')}:
        {String(seconds % 60).padStart(2, '0')}
      </text>
    </svg>
  );
}

export default function Login() {
  const { sendOtp, verifyOtp, adminLogin, loading } = useAuth();
  const navigate = useNavigate();

  const [tab,       setTab]       = useState('otp');
  const [step,      setStep]      = useState(1);
  const [isNew,     setIsNew]     = useState(false);
  const [email,     setEmail]     = useState('');
  const [otp,       setOtp]       = useState(['', '', '', '', '', '']);
  const [name,      setName]      = useState('');
  const [password,  setPassword]  = useState('');
  const [showPwd,   setShowPwd]   = useState(false);
  const [error,     setError]     = useState('');
  const [shake,     setShake]     = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [devCode,   setDevCode]   = useState(''); // shown in dev mode when no SMTP

  // Countdown
  const [timer,     setTimer]     = useState(OTP_TIMER);
  const [canResend, setCanResend] = useState(false);
  const timerRef  = useRef(null);
  const otpRefs   = useRef([]);

  const startTimer = useCallback(() => {
    setTimer(OTP_TIMER);
    setCanResend(false);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  /* ── Handlers ──────────────────────────────────────────── */
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setDevCode('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address');
      return;
    }
    try {
      const data = await sendOtp(email);
      setIsNew(!!data.isNewUser);
      // Show dev code hint if backend returned one (no SMTP configured)
      if (data.devCode) setDevCode(data.devCode);
      setStep(2);
      startTimer();
      // Auto-focus first OTP box after animation
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setError('');
    const code = otp.join('');
    if (code.length < 6) {
      setError('Enter the complete 6-digit code');
      triggerShake();
      return;
    }
    if (isNew && !name.trim()) {
      setError('Please enter your full name');
      return;
    }
    try {
      await verifyOtp(email, code, name);
      setSuccess(true);
      clearInterval(timerRef.current);
      setTimeout(() => navigate('/'), 900);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code. Try again.');
      triggerShake();
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 80);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setOtp(['', '', '', '', '', '']);
    setError('');
    setSuccess(false);
    setDevCode('');
    await handleSendOtp();
  };

  const handleOtpInput = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    // Auto-submit when all 6 digits are filled
    if (val && idx === 5 && next.every(d => d)) {
      setTimeout(() => handleVerifyOtp(new Event('submit')), 120);
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      const next = [...otp];
      next[idx - 1] = '';
      setOtp(next);
      otpRefs.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowLeft'  && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const arr = pasted.split('');
      setOtp(arr);
      otpRefs.current[5]?.focus();
      setTimeout(() => handleVerifyOtp(new Event('submit')), 120);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await adminLogin(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
      triggerShake();
    }
  };

  const handleTabSwitch = (t) => {
    setTab(t);
    setError('');
    setDevCode('');
    // Reset OTP state when switching tabs
    if (t === 'otp') {
      setStep(1);
      setOtp(['', '', '', '', '', '']);
      setSuccess(false);
    }
  };

  /* ── Derived ─────────────────────────────────────────── */
  const filledCount = otp.filter(Boolean).length;

  return (
    <div className="auth-page">
      <div className="auth-container">

        {/* ── Left Panel ─────────────────────────────────── */}
        <div className="auth-left" aria-hidden="true">
          <div className="auth-brand">
            <div className="auth-logo">S</div>
            <h2>ShopKart</h2>
          </div>
          <h1>India's Best Online Shopping Experience</h1>
          <ul className="auth-perks">
            {PERKS.map(([icon, text]) => (
              <li key={text}>
                <span>{icon}</span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Right Panel ────────────────────────────────── */}
        <div className="auth-right">

          {/* Tabs */}
          <div className="auth-tabs" role="tablist" aria-label="Login method">
            <button
              className={`auth-tab${tab === 'otp' ? ' active' : ''}`}
              onClick={() => handleTabSwitch('otp')}
              role="tab"
              aria-selected={tab === 'otp'}
              aria-controls="panel-otp"
            >
              ✉️ Login with Email
            </button>
            <button
              className={`auth-tab${tab === 'admin' ? ' active' : ''}`}
              onClick={() => handleTabSwitch('admin')}
              role="tab"
              aria-selected={tab === 'admin'}
              aria-controls="panel-admin"
            >
              ⚙️ Admin Login
            </button>
          </div>

          <AnimatePresence mode="wait">

            {/* ── OTP Tab ─────────────────────────────── */}
            {tab === 'otp' && (
              <motion.div
                key="otp"
                id="panel-otp"
                role="tabpanel"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: .2 }}
              >
                <form onSubmit={step === 1 ? handleSendOtp : handleVerifyOtp} className="auth-form" noValidate>
                  <div>
                    <h2>
                      {step === 1 ? 'Welcome back!' : (isNew ? '🎉 Create Account' : 'Enter your code')}
                    </h2>
                    <p className="auth-sub">
                      {step === 1
                        ? 'Enter your email to sign in or create a new account.'
                        : (
                          <>
                            We sent a 6-digit code to{' '}
                            <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
                          </>
                        )
                      }
                    </p>
                  </div>

                  {/* Email field — always visible, locked on step 2 */}
                  <div className="form-group">
                    <label className="label" htmlFor="email-input">Email Address</label>
                    <div className="email-input-wrapper">
                      <input
                        id="email-input"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="input"
                        disabled={step === 2}
                        autoFocus={step === 1}
                        autoComplete="email"
                        required
                        aria-describedby={step === 2 ? 'email-locked-hint' : undefined}
                      />
                      {step === 2 && (
                        <button
                          type="button"
                          className="edit-email-btn"
                          onClick={() => {
                            setStep(1);
                            setOtp(['', '', '', '', '', '']);
                            setError('');
                            setSuccess(false);
                            setDevCode('');
                            clearInterval(timerRef.current);
                          }}
                          aria-label="Change email address"
                        >
                          ✏️ Change
                        </button>
                      )}
                    </div>
                    {step === 2 && (
                      <span id="email-locked-hint" className="sr-only">
                        Email is locked. Click Change to use a different address.
                      </span>
                    )}
                  </div>

                  {/* Step 2 content — slides in below email on the SAME screen */}
                  <AnimatePresence>
                    {step === 2 && (
                      <motion.div
                        key="otp-section"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                      >
                        {/* Name field for new users */}
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

                        {/* Dev mode OTP hint */}
                        {devCode && (
                          <motion.div
                            initial={{ opacity: 0, scale: .95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                              background: 'rgba(234,179,8,.1)',
                              border: '1px solid rgba(234,179,8,.35)',
                              borderRadius: 'var(--r)',
                              padding: '10px 14px',
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#92400e',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            🛠 Dev mode — OTP: <span style={{ letterSpacing: 4, fontFamily: 'monospace', fontSize: 16 }}>{devCode}</span>
                          </motion.div>
                        )}

                        {/* ── 6-box OTP input ─────────────── */}
                        <div className="otp-section">
                          <label className="label" id="otp-label">Verification Code</label>
                          <motion.div
                            className="otp-inputs"
                            onPaste={handleOtpPaste}
                            role="group"
                            aria-labelledby="otp-label"
                            animate={shake ? { x: [0, -8, 8, -8, 8, -4, 4, 0] } : {}}
                            transition={{ duration: .5 }}
                          >
                            {otp.map((d, i) => (
                              <motion.input
                                key={i}
                                ref={el => (otpRefs.current[i] = el)}
                                id={`otp-${i}`}
                                type="tel"
                                inputMode="numeric"
                                maxLength={1}
                                value={d}
                                onChange={e => handleOtpInput(i, e.target.value)}
                                onKeyDown={e => handleOtpKeyDown(e, i)}
                                className={`otp-box${d ? ' otp-filled' : ''}${success ? ' otp-success' : ''}`}
                                aria-label={`Digit ${i + 1} of 6`}
                                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                                whileFocus={{ scale: 1.05, transition: { duration: .15 } }}
                              />
                            ))}
                          </motion.div>

                          {/* Fill progress bar */}
                          <div className="otp-progress-bar" style={{ marginTop: 8 }} aria-hidden="true">
                            <motion.div
                              className="otp-progress-fill"
                              animate={{ width: `${(filledCount / 6) * 100}%` }}
                              transition={{ duration: .2 }}
                            />
                          </div>
                        </div>

                        {/* ── Timer + Resend ─────────────── */}
                        <div className="otp-timer-row">
                          <CountdownRing seconds={timer} total={OTP_TIMER} />
                          <div className="otp-timer-info">
                            <span className="otp-timer-label">
                              {canResend ? 'Code expired' : 'Code expires in'}
                            </span>
                            <button
                              type="button"
                              className={`resend-otp${canResend ? ' resend-active' : ''}`}
                              onClick={handleResendOtp}
                              disabled={!canResend || loading}
                              aria-live="polite"
                            >
                              {loading ? '📤 Sending...' : canResend ? '🔄 Resend Code' : 'Resend Code'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error message */}
                  <AnimatePresence>
                    {error && (
                      <motion.p
                        className="auth-error"
                        role="alert"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        ⚠ {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Success banner */}
                  <AnimatePresence>
                    {success && (
                      <motion.div
                        className="otp-success-banner"
                        role="status"
                        aria-live="polite"
                        initial={{ opacity: 0, scale: .9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        ✅ Verified! Redirecting…
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* CTA button */}
                  {step === 1 ? (
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%' }}
                      disabled={loading || !email}
                    >
                      {loading ? <span className="spinner" /> : 'Send Verification Code →'}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%' }}
                      disabled={loading || filledCount < 6}
                    >
                      {loading
                        ? <span className="spinner" />
                        : isNew ? 'Create Account →' : 'Verify & Sign In →'}
                    </button>
                  )}

                  {step === 1 && (
                    <p className="auth-note">
                      By continuing, you agree to our{' '}
                      <Link to="/terms">Terms of Service</Link> and{' '}
                      <Link to="/privacy">Privacy Policy</Link>.
                    </p>
                  )}
                </form>
              </motion.div>
            )}

            {/* ── Admin Tab ──────────────────────────── */}
            {tab === 'admin' && (
              <motion.div
                key="admin"
                id="panel-admin"
                role="tabpanel"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: .2 }}
              >
                <form onSubmit={handleAdminLogin} className="auth-form" noValidate>
                  <div>
                    <h2>Admin Login</h2>
                    <p className="auth-sub">Access the ShopKart admin dashboard.</p>
                  </div>

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
                      required
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
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(v => !v)}
                        style={{
                          position: 'absolute', right: 12, top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-muted)', fontSize: 13,
                          background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                        }}
                        aria-label={showPwd ? 'Hide password' : 'Show password'}
                      >
                        {showPwd ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        className="auth-error"
                        role="alert"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
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
