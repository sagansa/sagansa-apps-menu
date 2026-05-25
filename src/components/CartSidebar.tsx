'use client';

import { useState } from 'react';
import { CartItem, TenantStoreInfo } from '@/types';

interface CartSidebarProps {
  cart: CartItem[];
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  total: number;
  tenantStoreInfo: TenantStoreInfo;
  isOpen: boolean;
  onClose: () => void;
}

export function CartSidebar({ 
  cart, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart, 
  total, 
  tenantStoreInfo,
  isOpen,
  onClose
}: CartSidebarProps) {
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phoneNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real application, this would submit to the API
      console.log('Submitting order:', {
        storeId: tenantStoreInfo.store.id,
        tableCode: tenantStoreInfo.store.tableCode,
        customerInfo,
        items: cart,
        total
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Order submitted successfully!');
      onClearCart();
      setCustomerInfo({ name: '', email: '', phoneNumber: '' });
      onClose();
    } catch (error) {
      alert('Failed to submit order. Please try again.');
      console.error('Order submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Your Order</h2>
          {cartItemCount > 0 && (
            <button 
              onClick={onClearCart}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {cart.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Your cart is empty</p>
            <p className="text-sm text-gray-400 mt-1">Add items to get started</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium">{item.productName}</h3>
                      {item.variantName && (
                        <p className="text-sm text-gray-600">Variant: {item.variantName}</p>
                      )}
                      <p className="text-sm text-gray-500">Rp {item.unitPrice.toLocaleString()}</p>
                    </div>
                    <button 
                      onClick={() => onRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Modifications */}
                  {item.modifications && item.modifications.length > 0 && (
                    <div className="mt-2 pl-2">
                      {item.modifications.map(mod => (
                        <div key={mod.id} className="flex justify-between text-sm text-gray-600">
                          <span>+ {mod.quantity}x {mod.name}</span>
                          <span>Rp {(mod.price * mod.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-l text-gray-600"
                      >
                        -
                      </button>
                      <span className="w-10 h-8 flex items-center justify-center border-t border-b border-gray-300">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r text-gray-600"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-medium">Rp {item.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Customer Information */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="customer-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="customer-name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="customer-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="customer-email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="customer-phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="customer-phone"
                    value={customerInfo.phoneNumber}
                    onChange={(e) => setCustomerInfo({...customerInfo, phoneNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+62 812 3456 7890"
                  />
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-2 mt-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rp {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (10%)</span>
                <span>Rp {(total * 0.1).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>Rp {(total * 1.1).toLocaleString()}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || cart.length === 0}
              className={`w-full mt-6 py-3 px-4 rounded-md text-white font-medium ${
                isSubmitting || cart.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Place Order'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}