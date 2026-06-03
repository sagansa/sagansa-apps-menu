import { CartItem } from '@/types';
import { useState } from 'react';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
  total: number;
}

export const Cart = ({ items, onUpdateQuantity, onRemoveItem, onCheckout, total }: CartProps) => {
  const [showFullCart, setShowFullCart] = useState(true);
  const formatCurrency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <h2 className="text-lg font-semibold mb-4">Your Cart</h2>
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <p>Your cart is empty</p>
          <p className="text-sm mt-2">Add items to get started</p>
        </div>
        <div className="mt-auto pt-4 border-t">
          <p className="text-lg font-bold">Total: Rp 0</p>
          <button 
            className="w-full mt-2 py-2 bg-gray-300 text-gray-700 rounded-md font-medium cursor-not-allowed"
            disabled
          >
            Checkout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Your Cart</h2>
        <button 
          onClick={() => setShowFullCart(!showFullCart)}
          className="text-blue-600 text-sm"
        >
          {showFullCart ? 'Minimize' : 'Expand'}
        </button>
      </div>

      {showFullCart ? (
        <div className="flex-1 overflow-y-auto mb-4">
          {items.map(item => (
            <div key={item.id} className="py-2 border-b border-gray-200">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-medium">{item.productName}</h3>
                  <div className="mt-1 text-xs text-gray-500">
                    <div className="flex justify-between gap-3">
                      <span>Harga item</span>
                      <span>{formatCurrency(item.basePrice ?? item.unitPrice)}</span>
                    </div>
                  </div>
                  {item.variantName && (
                    <p className="text-sm text-gray-600">
                      {item.variantName}
                      {(item.variantPriceAdjustment ?? 0) > 0 && ` (+${formatCurrency(item.variantPriceAdjustment ?? 0)})`}
                    </p>
                  )}
                  {item.modifications.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {item.modifications.map(mod => (
                        <div key={mod.id}>
                          + {mod.name} ({formatCurrency(mod.price)})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                  <div className="flex items-center mt-1">
                    <button 
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded-l text-gray-600"
                    >
                      -
                    </button>
                    <span className="w-8 h-6 flex items-center justify-center border-t border-b border-gray-300">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded-r text-gray-600"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-1">
                <button 
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-500 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 mb-4">
          {items.length} item{items.length !== 1 ? 's' : ''} in cart
        </div>
      )}

      <div className="mt-auto pt-4 border-t">
        <div className="flex justify-between mb-2">
          <span>Subtotal:</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <button
          onClick={onCheckout}
          className="w-full mt-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
        >
          Checkout
        </button>
      </div>
    </div>
  );
};
