'use client';

import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CartItem, Product } from '@/types';

interface CartContextValue {
  cart: CartItem[];
  addToCart: (product: Product, variantId?: string, modifications?: { id: string; quantity: number }[]) => void;
  updateQuantity: (itemId: string, newQuantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    // Load cart from localStorage on initial render
    const savedCart = localStorage.getItem('web_order_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse saved cart:', error);
        localStorage.removeItem('web_order_cart');
      }
    }
  }, []);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    localStorage.setItem('web_order_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, variantId?: string, modifications: { id: string; quantity: number }[] = []) => {
    setCart(prevCart => {
      // Check if item already exists in cart
      const existingItemIndex = prevCart.findIndex(
        item => 
          item.productId === product.id && 
          item.variantId === variantId &&
          JSON.stringify(item.modifications.map(m => ({ id: m.id, quantity: m.quantity }))) === 
          JSON.stringify(modifications.map(m => ({ id: m.id, quantity: m.quantity })))
      );

      if (existingItemIndex > -1) {
        // Update quantity if item exists
        const newCart = [...prevCart];
        const existingItem = newCart[existingItemIndex];
        const newQuantity = existingItem.quantity + 1;
        const newTotalPrice = existingItem.unitPrice * newQuantity;
        newCart[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          totalPrice: newTotalPrice
        };
        return newCart;
      } else {
        // Add new item to cart
        const variant = variantId && product.variants ? product.variants.find(v => v.id === variantId) : undefined;
        const basePrice = variant ? variant.price : product.price;
        const modificationDetails = modifications.map(mod => {
          const modDetail = product.modifications?.find(m => m.id === mod.id);
          return {
            id: modDetail?.id || mod.id,
            name: modDetail?.name || `Modification ${mod.id}`,
            price: modDetail?.price || 0,
            quantity: mod.quantity
          };
        });
        
        // Calculate total price including modifications
        const modificationsTotal = modificationDetails.reduce((sum, mod) => sum + (mod.price * mod.quantity), 0);
        const unitPrice = basePrice + modificationsTotal;
        const totalPrice = unitPrice * 1; // Quantity is 1 for new items
        
        const newItem: CartItem = {
          id: `${product.id}-${variantId || 'default'}-${Date.now()}`,
          productId: product.id,
          productName: product.name,
          variantId: variant?.id,
          variantName: variant?.name,
          quantity: 1,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
          modifications: modificationDetails
        };

        return [...prevCart, newItem];
      }
    });
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }

    setCart(prevCart => 
      prevCart.map(item => {
        if (item.id === itemId) {
          const newTotalPrice = item.unitPrice * newQuantity;
          return { ...item, quantity: newQuantity, totalPrice: newTotalPrice };
        }
        return item;
      })
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = useMemo(() => 
    cart.reduce((total, item) => total + item.totalPrice, 0),
    [cart]
  );

  const cartItemCount = useMemo(() => 
    cart.reduce((count, item) => count + item.quantity, 0),
    [cart]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      cartTotal,
      cartItemCount
    }),
    [cart, addToCart, updateQuantity, removeFromCart, clearCart, cartTotal, cartItemCount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
}