'use client';

import { useState, useEffect } from 'react';
import { Product, CartItem, TenantStoreInfo } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { CartSidebar } from '@/components/CartSidebar';
import apiService from '@/lib/api';
import { Share2, Check, Copy } from 'lucide-react';

interface MenuPageProps {
  tenantStoreInfo: TenantStoreInfo;
}

export function MenuPage({ tenantStoreInfo }: MenuPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch real products data
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await apiService.getPublicProducts(tenantStoreInfo.store.id);
        if (response.success) {
          // Map backend product structure to frontend Product interface if needed
          // For now assuming they are similar or compatible
          setProducts(response.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [tenantStoreInfo.store.id]);

  const addToCart = (product: Product, variantId?: string, modifications: { id: string; quantity: number }[] = []) => {
    setCart(prevCart => {
      // Check if item already exists in cart
      const existingItemIndex = prevCart.findIndex(
        item => 
          item.productId === product.id && 
          item.variantId === variantId &&
          JSON.stringify(item.modifications.map(m => ({ id: m.id, quantity: m.quantity }))) === 
          JSON.stringify(modifications)
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
        const variant = variantId ? product.variants?.find(v => v.id === variantId) : undefined;
        const unitPrice = variant ? variant.price : product.price;
        const modificationDetails = modifications.map(mod => {
          const modDetail = product.modifications?.find(m => m.id === mod.id);
          return {
            id: modDetail?.id || '',
            name: modDetail?.name || '',
            price: modDetail?.price || 0,
            quantity: mod.quantity
          };
        });
        
        // Calculate total price including modifications
        const modificationsTotal = modificationDetails.reduce((sum, mod) => sum + (mod.price * mod.quantity), 0);
        const totalPrice = (unitPrice + modificationsTotal) * 1; // Quantity is 1 for new items
        
        const newItem: CartItem = {
          id: `${product.id}-${variantId || 'default'}-${Date.now()}`,
          productId: product.id,
          productName: product.name,
          variantId: variant?.id,
          variantName: variant?.name,
          quantity: 1,
          unitPrice: unitPrice + modificationsTotal,
          totalPrice: totalPrice,
          modifications: modificationDetails
        };

        return [...prevCart, newItem];
      }
    });
    
    // Open cart sidebar when adding items
    setIsCartOpen(true);
  };

  const updateCartQuantity = (itemId: string, newQuantity: number) => {
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

  const isViewOnly = tenantStoreInfo.store.tableCode === 'VIEW';
  const cartTotal = cart.reduce((total, item) => total + item.totalPrice, 0);
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?tenantId=${tenantStoreInfo.id}&storeId=${tenantStoreInfo.store.id}&tableCode=VIEW`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Check out the menu at ${tenantStoreInfo.store.name}: ${getShareUrl()}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{tenantStoreInfo.store.name}</h1>
            <p className="text-sm text-gray-500">Table: {tenantStoreInfo.store.tableCode}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowShareModal(true)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
              title="Share Menu"
            >
              <Share2 className="w-5 h-5" />
            </button>
            {!isViewOnly && (
              <div className="relative">
                <button 
                  onClick={() => setIsCartOpen(true)}
                  className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>Cart</span>
                  {cartItemCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Products Grid - Takes 3/4 of the width on medium screens and up */}
          <div className="md:col-span-3">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Menu</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={isViewOnly ? undefined : addToCart} 
                />
              ))}
            </div>
          </div>
          
          {/* Cart Sidebar - Hidden on mobile, visible on desktop */}
          <div className="md:col-span-1 hidden md:block">
            <CartSidebar 
              cart={cart}
              onUpdateQuantity={updateCartQuantity}
              onRemoveItem={removeFromCart}
              onClearCart={clearCart}
              total={cartTotal}
              tenantStoreInfo={tenantStoreInfo}
              isOpen={isCartOpen}
              onClose={() => setIsCartOpen(false)}
            />
          </div>
        </div>
      </main>

      {/* Mobile Cart Button */}
      {cartItemCount > 0 && !isViewOnly && (
        <div className="fixed bottom-4 right-4 md:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-blue-600 text-white rounded-full p-4 shadow-lg flex items-center"
          >
            <span>View Cart ({cartItemCount})</span>
          </button>
        </div>
      )}

      {/* Mobile Cart Sidebar */}
      <div className={`fixed inset-0 z-50 ${isCartOpen ? 'block' : 'hidden'}`}>
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setIsCartOpen(false)}
        ></div>
        <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
          <CartSidebar 
            cart={cart}
            onUpdateQuantity={updateCartQuantity}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            total={cartTotal}
            tenantStoreInfo={tenantStoreInfo}
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
          />
        </div>
      </div>
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Share Menu</h3>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-500 truncate mr-2">{getShareUrl()}</span>
                  <button 
                    onClick={handleCopyLink}
                    className="flex-shrink-0 bg-white p-2 rounded-lg border border-gray-200 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button 
                  onClick={handleShareWhatsApp}
                  className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-[#20bd5a] transition-colors shadow-lg shadow-green-200"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span>WhatsApp Menu</span>
                </button>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 text-center">
              <p className="text-xs text-gray-400">Anyone with this link can view the menu</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}