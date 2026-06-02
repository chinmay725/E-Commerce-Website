import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './ctx/AuthContext';
import { CartProvider } from './ctx/CartContext';
import Navbar      from './components/nav/Navbar';
import CartSidebar from './components/cart/CartSidebar';
import Footer      from './components/footer/Footer';
import './css/globals.css';

const Home          = lazy(() => import('./pages/Home'));
const Products      = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/Detail'));
const Category      = lazy(() => import('./pages/Category'));
const Login         = lazy(() => import('./pages/Login'));
const Checkout      = lazy(() => import('./pages/Checkout'));
const Admin         = lazy(() => import('./pages/Admin'));
const Wishlist      = lazy(() => import('./pages/Wishlist'));
const OtherPages    = lazy(() => import('./pages/Misc'));

function PageLoader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:14 }}>
      <div style={{
        width:40, height:40,
        border:'3px solid var(--border)',
        borderTopColor:'var(--brand)',
        borderRadius:'50%',
        animation:'spin .7s linear infinite',
      }} />
      <p style={{ color:'var(--text-muted)', fontSize:14 }}>Loading…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Protected({ children, adminRequired = false }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminRequired && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

function NotFound() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'80vh', flexDirection:'column', gap:16, textAlign:'center', padding:20 }}>
      <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color:'var(--text-muted)' }}>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <h1>404 — Page Not Found</h1>
      <p style={{ color:'var(--text-muted)', maxWidth:360 }}>The page you're looking for doesn't exist or has been moved.</p>
      <a href="/" className="btn btn-primary btn-lg">Back to Home</a>
    </div>
  );
}

// Lazy-loaded sub-page components with correct named exports
const CartPage    = lazy(() => import('./pages/Misc').then(m => ({ default: m.CartPage })));
const OrdersPage  = lazy(() => import('./pages/Misc').then(m => ({ default: m.OrdersPage })));
const Dashboard   = lazy(() => import('./pages/Misc').then(m => ({ default: m.Dashboard })));

function AppShell() {
  const [theme, setTheme] = useState(() => localStorage.getItem('sk_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sk_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <Router>
      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          top: '-40px',
          left: '0',
          background: 'var(--brand)',
          color: 'white',
          padding: '8px 16px',
          zIndex: '100',
          transition: 'top 0.3s',
        }}
        onFocus={(e) => e.target.style.top = '0'}
        onBlur={(e) => e.target.style.top = '-40px'}
      >
        Skip to main content
      </a>
      
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <CartSidebar />
      <Suspense fallback={<PageLoader />}>
        <div id="main-content">
          <Routes>
            <Route path="/"               element={<Home />} />
            <Route path="/products"       element={<Products />} />
            <Route path="/category/:slug" element={<Category />} />
            <Route path="/product/:slug"  element={<ProductDetail />} />
            <Route path="/login"          element={<Login />} />
            <Route path="/signup"         element={<Login />} />

            <Route path="/cart"      element={<Protected><CartPage /></Protected>} />
            <Route path="/checkout"  element={<Protected><Checkout /></Protected>} />
            <Route path="/orders"    element={<Protected><OrdersPage /></Protected>} />
            <Route path="/wishlist"  element={<Protected><Wishlist /></Protected>} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />

            <Route path="/admin"   element={<Protected adminRequired><Admin /></Protected>} />
            <Route path="/admin/*" element={<Protected adminRequired><Admin /></Protected>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Suspense>
      <Footer />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3200,
          style: {
            background: 'var(--surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-light)',
            borderRadius: '12px',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            boxShadow: 'var(--s-md)',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#10B981', secondary: 'white' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: 'white' } },
        }}
      />
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppShell />
      </CartProvider>
    </AuthProvider>
  );
}
