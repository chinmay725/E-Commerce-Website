import React from 'react';
import { useParams } from 'react-router-dom';
import Products from './Products';

// Category icons and descriptions
const CATEGORY_META = {
  mobiles:      { icon: '📱', desc: 'Smartphones, Feature Phones & Accessories' },
  fashion:      { icon: '👗', desc: 'Clothing, Footwear, Watches & Accessories' },
  electronics:  { icon: '💻', desc: 'Laptops, Cameras, Audio & Gaming' },
  appliances:   { icon: '🏠', desc: 'Kitchen, Home & Personal Care Appliances' },
  sports:       { icon: '⚽', desc: 'Fitness, Sports Equipment & Outdoor Gear' },
  health:       { icon: '💊', desc: 'Personal Care, Wellness & Beauty Products' },
  books:        { icon: '📚', desc: 'Books, eBooks, Stationery & Gifts' },
  'home-kitchen': { icon: '🛋', desc: 'Furniture, Decor, Kitchen & Dining' },
};

export default function CategoryPage() {
  const { slug } = useParams();
  const meta = CATEGORY_META[slug] || { icon: '🛍', desc: 'Browse products in this category' };

  return (
    <div>
      {/* Category Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-pale), var(--bg-secondary))',
        borderBottom: '1px solid var(--border-light)',
        padding: '28px 0 20px',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 64, height: 64,
            background: 'white',
            borderRadius: 'var(--radius-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, boxShadow: 'var(--shadow)',
          }}>
            {meta.icon}
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', marginBottom: 4, textTransform: 'capitalize' }}>
              {slug?.replace(/-/g, ' ')}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{meta.desc}</p>
          </div>
        </div>
      </div>

      {/* Products with pre-filtered category */}
      <Products categorySlug={slug} />
    </div>
  );
}
