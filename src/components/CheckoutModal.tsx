'use client';

import { useState } from 'react';
import { CartItem, TenantStoreInfo } from '@/types';
import { submitOrder } from '@/lib/api';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  tenantStoreInfo: TenantStoreInfo;
  onSubmit: (customerInfo: { name: string; email?: string; phone?: string; specialRequests?: string }) => void;
}

export const CheckoutModal = ({ isOpen, onClose, cart, total, tenantStoreInfo, onSubmit }: CheckoutModalProps) => {
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!customerInfo.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      // Prepare order data
      const orderData = {
        tenant_id: tenantStoreInfo.id,
        store_id: tenantStoreInfo.store.id,
        table_code: tenantStoreInfo.store.tableCode,
        customer_name: customerInfo.name,
        customer_email: customerInfo.email || null,
        customer_phone: customerInfo.phone || null,
        subtotal: total,
        discount_total: 0,
        tax_total: 0,
        service_total: 0,
        grand_total: total,
        order_items: cart.map(item => ({
          product_id: item.productId,
          product_variant_id: item.variantId ?? null,
          name_snapshot: item.productName, // Snapshot for historical record
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          notes: customerInfo.specialRequests || null,
          modifications: item.modifications.map(mod => ({
            product_modification_id: mod.id,
            price: mod.price,
            quantity: 1
          }))
        }))
      };
      
      // Submit the order to the API
      await submitOrder(orderData);
      
      onSubmit(customerInfo);
    } catch (error) {
      console.error('Error submitting order:', error);
      // Handle error appropriately (e.g., show user-friendly error message)
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Checkout</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="+62 812 3456 7890"
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-1">
                Special Requests
              </label>
              <textarea
                id="specialRequests"
                value={customerInfo.specialRequests}
                onChange={(e) => setCustomerInfo({...customerInfo, specialRequests: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Any special requests or dietary restrictions..."
              />
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Order Summary</h3>
              <div className="border rounded-md p-4 max-h-40 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <div>
                      <span>{item.quantity}x {item.productName}</span>
                      {item.variantName && <span> ({item.variantName})</span>}
                      {item.modifications.length > 0 && (
                        <div className="text-gray-500">
                          {item.modifications.map(mod => (
                            <div key={mod.id}>+ {mod.name}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <span>Rp {item.totalPrice.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>Rp {total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Place Order
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
