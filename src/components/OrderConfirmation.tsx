'use client';

import { Order } from '@/types';

interface OrderConfirmationProps {
  order: Order;
  onNewOrder: () => void;
}

export function OrderConfirmation({ order, onNewOrder }: OrderConfirmationProps) {
  const formatCurrency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-green-500 p-6 text-center">
          <svg className="w-16 h-16 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h2 className="text-2xl font-bold text-white mt-4">Order Confirmed!</h2>
          <p className="text-green-100 mt-2">Your order has been successfully placed</p>
        </div>

        <div className="p-6">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <h3 className="text-lg font-semibold">Order #{order.id.substring(0, 8)}</h3>
            <p className="text-gray-600 text-sm">Table: {order.tableCode}</p>
            {order.customerName && (
              <p className="text-gray-600 text-sm">Customer: {order.customerName}</p>
            )}
            <p className="text-gray-600 text-sm">
              Status: <span className="capitalize font-medium">{order.status}</span>
            </p>
          </div>

          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  {item.variantName && (
                    <p className="text-sm text-gray-600">{item.variantName}</p>
                  )}
                  {item.modifications.length > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      {item.modifications.map(mod => (
                        <div key={mod.id}>+ {mod.name}</div>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.taxTotal > 0 && (
              <div className="flex justify-between">
                <span>Pajak</span>
                <span>{formatCurrency(order.taxTotal)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg pt-2">
              <span>Total</span>
              <span>{formatCurrency(order.grandTotal)}</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={onNewOrder}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Place Another Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
