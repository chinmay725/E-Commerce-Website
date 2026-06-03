import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart]         = useState({ items: [], subtotal: 0, total: 0, itemCount: 0, shipping: 0, savings: 0 });
  const [loading, setLoading]   = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const fetchCart = async () => {
    try {
      const { data } = await api.get('/cart');
      setCart(data.data);
    } catch (e) { console.error(e); }
  };

  const updateLocalCartState = useCallback((items) => {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const savings  = items.reduce((s, i) => s + ((i.mrp || i.price) - i.price) * i.quantity, 0);
    const shipping = subtotal === 0 || subtotal > 499 ? 0 : 49;
    const total    = subtotal + shipping;
    setCart({
      items,
      subtotal,
      savings,
      shipping,
      total,
      itemCount: items.length
    });
  }, []);

  const mergeCart = useCallback(async () => {
    const localCart = JSON.parse(localStorage.getItem('sk_cart')) || [];
    if (localCart.length > 0) {
      setLoading(true);
      try {
        console.log('[CartContext] Merging local guest cart with server cart...');
        for (const item of localCart) {
          await api.post('/cart', { product_id: item.product_id, quantity: item.quantity });
        }
        localStorage.removeItem('sk_cart');
        console.log('[CartContext] Local guest cart successfully merged.');
      } catch (e) {
        console.error('[CartContext] Failed to merge local cart:', e);
      } finally {
        setLoading(false);
      }
    }
    await fetchCart();
  }, []);

  useEffect(() => {
    if (user) {
      mergeCart();
    } else {
      const localCart = JSON.parse(localStorage.getItem('sk_cart')) || [];
      updateLocalCartState(localCart);
    }
  }, [user, mergeCart, updateLocalCartState]);

  const addToCart = useCallback(async (productOrId, quantity = 1) => {
    console.log('[CartContext] addToCart called. productOrId:', productOrId, 'qty:', quantity, 'user:', user);
    
    const isId = typeof productOrId === 'string';
    const productId = isId ? productOrId : productOrId.id;

    if (user) {
      setLoading(true);
      try {
        console.log('[CartContext] Posting /cart to API...');
        const res = await api.post('/cart', { product_id: productId, quantity });
        console.log('[CartContext] API post response:', res.data);
        console.log('[CartContext] Fetching updated cart...');
        await fetchCart();
        console.log('[CartContext] Triggering toast.success...');
        toast.success('Added to cart! 🛒');
        console.log('[CartContext] Setting cartOpen to true...');
        setCartOpen(true);
        return true;
      } catch (e) {
        console.error('[CartContext] API error adding to cart:', e);
        toast.error(e.response?.data?.message || 'Failed to add to cart');
        return false;
      } finally {
        console.log('[CartContext] Setting loading to false');
        setLoading(false);
      }
    } else {
      // Guest cart flow
      const product = isId ? null : productOrId;
      if (!product) {
        console.warn('[CartContext] Attempted guest addToCart with only ID:', productOrId);
        toast.error('Please login to add items to cart');
        return false;
      }

      const localCart = JSON.parse(localStorage.getItem('sk_cart')) || [];
      const existing = localCart.find(item => item.product_id === product.id);

      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, product.stock);
      } else {
        localCart.push({
          id: product.id,
          product_id: product.id,
          quantity: Math.min(quantity, product.stock),
          name: product.name,
          slug: product.slug,
          price: product.price,
          mrp: product.mrp,
          thumbnail_url: product.thumbnail_url,
          stock: product.stock,
          is_active: product.is_active,
          added_at: new Date().toISOString()
        });
      }

      localStorage.setItem('sk_cart', JSON.stringify(localCart));
      updateLocalCartState(localCart);
      toast.success('Added to cart! 🛒');
      setCartOpen(true);
      return true;
    }
  }, [user, updateLocalCartState]);

  const updateQuantity = async (itemId, quantity) => {
    if (user) {
      try {
        await api.patch(`/cart/${itemId}`, { quantity });
        await fetchCart();
      } catch (e) { toast.error('Update failed'); }
    } else {
      const localCart = JSON.parse(localStorage.getItem('sk_cart')) || [];
      const updated = localCart.map(item => {
        if (item.id === itemId) {
          return { ...item, quantity: Math.min(Math.max(1, quantity), item.stock || 99) };
        }
        return item;
      });
      localStorage.setItem('sk_cart', JSON.stringify(updated));
      updateLocalCartState(updated);
    }
  };

  const removeItem = async (itemId) => {
    if (user) {
      try {
        await api.delete(`/cart/${itemId}`);
        await fetchCart();
        toast.success('Removed from cart');
      } catch (e) { toast.error('Remove failed'); }
    } else {
      const localCart = JSON.parse(localStorage.getItem('sk_cart')) || [];
      const filtered = localCart.filter(item => item.id !== itemId);
      localStorage.setItem('sk_cart', JSON.stringify(filtered));
      updateLocalCartState(filtered);
      toast.success('Removed from cart');
    }
  };

  const clearCart = async () => {
    if (user) {
      try {
        await api.delete('/cart');
        setCart({ items: [], subtotal: 0, total: 0, itemCount: 0, shipping: 0, savings: 0 });
      } catch (e) { toast.error('Clear failed'); }
    } else {
      localStorage.removeItem('sk_cart');
      setCart({ items: [], subtotal: 0, total: 0, itemCount: 0, shipping: 0, savings: 0 });
    }
  };

  return (
    <CartContext.Provider value={{ cart, loading, cartOpen, setCartOpen, addToCart, updateQuantity, removeItem, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
