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

  useEffect(() => {
    if (user) fetchCart();
    else setCart({ items: [], subtotal: 0, total: 0, itemCount: 0, shipping: 0, savings: 0 });
  }, [user]);

  const fetchCart = async () => {
    try {
      const { data } = await api.get('/cart');
      setCart(data.data);
    } catch (e) { console.error(e); }
  };

  const addToCart = useCallback(async (productId, quantity = 1) => {
    if (!user) { toast.error('Please login to add items to cart'); return false; }
    setLoading(true);
    try {
      await api.post('/cart', { product_id: productId, quantity });
      await fetchCart();
      toast.success('Added to cart! 🛒');
      setCartOpen(true);
      return true;
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add to cart');
      return false;
    } finally { setLoading(false); }
  }, [user]);

  const updateQuantity = async (itemId, quantity) => {
    try {
      await api.patch(`/cart/${itemId}`, { quantity });
      await fetchCart();
    } catch (e) { toast.error('Update failed'); }
  };

  const removeItem = async (itemId) => {
    try {
      await api.delete(`/cart/${itemId}`);
      await fetchCart();
      toast.success('Removed from cart');
    } catch (e) { toast.error('Remove failed'); }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart');
      setCart({ items: [], subtotal: 0, total: 0, itemCount: 0, shipping: 0, savings: 0 });
    } catch (e) { toast.error('Clear failed'); }
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
