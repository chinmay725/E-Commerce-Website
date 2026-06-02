import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const LINKS = {
  'Company': [['About Us','/about'],['Careers','/careers'],['Press','/press'],['Blog','/blog']],
  'Help':    [['FAQ','/faq'],['Contact Us','/contact'],['Track Order','/orders'],['Returns','/returns']],
  'Shop':    [['Mobiles','/category/mobiles'],['Fashion','/category/fashion'],['Electronics','/category/electronics'],['Sports','/category/sports']],
  'Legal':   [['Privacy Policy','/privacy'],['Terms of Use','/terms'],['Sitemap','/sitemap']],
};

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.includes('@')) { setSubscribed(true); setEmail(''); }
  };

  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="container">
          <div className="footer-grid">
            {/* Brand */}
            <div className="footer-brand">
              <Link to="/" className="footer-logo">
                <div className="footer-logo-icon">S</div>
                <span>Shop<strong>Kart</strong></span>
              </Link>
              <p>India's most trusted online shopping destination. Shop millions of products from top brands with fast delivery.</p>
              <div className="footer-social">
                {[['F','Facebook'],['T','Twitter'],['I','Instagram'],['Y','YouTube'],['L','LinkedIn']].map(([letter, name]) => (
                  <a key={name} href="#" className="social-link" title={name} aria-label={name}>
                    {letter}
                  </a>
                ))}
              </div>
              <div className="footer-newsletter">
                <h4>Stay in the loop</h4>
                <p>Deals, launches & exclusive offers.</p>
                {subscribed ? (
                  <p style={{ color: '#10B981', fontWeight: 600, fontSize: 13 }}>✓ You're subscribed!</p>
                ) : (
                  <form className="newsletter-form" onSubmit={handleSubscribe}>
                    <input
                      type="email"
                      className="newsletter-input"
                      placeholder="your@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      aria-label="Email for newsletter"
                    />
                    <button type="submit" className="newsletter-btn">Subscribe</button>
                  </form>
                )}
              </div>
            </div>

            {/* Links */}
            {Object.entries(LINKS).map(([group, links]) => (
              <div key={group} className="footer-col">
                <h4>{group}</h4>
                <ul>
                  {links.map(([label, href]) => (
                    <li key={label}><Link to={href}>{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container">
          <p>© {new Date().getFullYear()} ShopKart Pvt. Ltd. All rights reserved. Made with ❤️ in India.</p>
          <div className="payment-icons">
            {['VISA','MC','UPI','GPay','Paytm','RuPay'].map(p => (
              <span key={p} className="payment-icon">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
