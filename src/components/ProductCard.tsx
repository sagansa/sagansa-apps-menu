'use client';

import { useState } from 'react';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, variantId?: string, modifications?: { id: string; quantity: number }[]) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(undefined);
  const [selectedModifications, setSelectedModifications] = useState<{ id: string; quantity: number }[]>([]);
  const [showModifications, setShowModifications] = useState(false);

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, selectedVariant, selectedModifications);
      // Reset selections after adding to cart
      setSelectedVariant(undefined);
      setSelectedModifications([]);
      setShowModifications(false);
    }
  };

  const toggleModification = (modId: string) => {
    setSelectedModifications(prev => {
      const existingIndex = prev.findIndex(m => m.id === modId);
      
      if (existingIndex > -1) {
        // Remove if already selected
        return prev.filter(m => m.id !== modId);
      } else {
        // Add with quantity 1
        return [...prev, { id: modId, quantity: 1 }];
      }
    });
  };

  const updateModificationQuantity = (modId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      setSelectedModifications(prev => prev.filter(m => m.id !== modId));
      return;
    }

    setSelectedModifications(prev => 
      prev.map(m => m.id === modId ? { ...m, quantity: newQuantity } : m)
    );
  };

  const getSelectedPrice = () => {
    if (selectedVariant && product.variants) {
      const variant = product.variants.find(v => v.id === selectedVariant);
      return variant ? variant.price : product.price;
    }
    return product.price;
  };

  const isSelected = (modId: string) => {
    return selectedModifications.some(m => m.id === modId);
  };

  const getModificationQuantity = (modId: string) => {
    const mod = selectedModifications.find(m => m.id === modId);
    return mod ? mod.quantity : 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
      {product.image ? (
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-48 flex items-center justify-center">
          <span className="text-gray-500">No Image</span>
        </div>
      )}
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{product.name}</h3>
            {product.category && (
              <p className="text-xs text-gray-500 mt-1">{product.category}</p>
            )}
          </div>
          <span className="font-bold text-blue-600">
            Rp {getSelectedPrice().toLocaleString()}
          </span>
        </div>
        
        {product.description && (
          <p className="text-gray-600 text-sm mt-2">{product.description}</p>
        )}

        {/* Variants */}
        {product.variants && product.variants.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700">Variants:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {product.variants.map(variant => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(selectedVariant === variant.id ? undefined : variant.id)}
                  className={`text-xs px-2 py-1 rounded-full border ${
                    selectedVariant === variant.id
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {variant.name} {variant.price !== product.price && `(+Rp ${(variant.price - product.price).toLocaleString()})`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modifications Toggle */}
        {product.modifications && product.modifications.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowModifications(!showModifications)}
              className="text-sm font-medium text-gray-700 flex items-center"
            >
              Add-ons
              <svg 
                className={`ml-1 w-4 h-4 transition-transform ${showModifications ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showModifications && (
              <div className="mt-2 space-y-2">
                {product.modifications.map(mod => (
                  <div key={mod.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`mod-${mod.id}`}
                        checked={isSelected(mod.id)}
                        onChange={() => toggleModification(mod.id)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <label htmlFor={`mod-${mod.id}`} className="ml-2 text-sm text-gray-700">
                        {mod.name} (+Rp {mod.price.toLocaleString()})
                      </label>
                    </div>
                    {isSelected(mod.id) && (
                      <div className="flex items-center">
                        <button
                          onClick={() => updateModificationQuantity(mod.id, getModificationQuantity(mod.id) - 1)}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded-l text-gray-600"
                        >
                          -
                        </button>
                        <span className="w-8 h-6 flex items-center justify-center border-t border-b border-gray-300">
                          {getModificationQuantity(mod.id)}
                        </span>
                        <button
                          onClick={() => updateModificationQuantity(mod.id, getModificationQuantity(mod.id) + 1)}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded-r text-gray-600"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {onAddToCart && (
          <button
            onClick={handleAddToCart}
            disabled={!product.isAvailable}
            className={`w-full mt-4 py-2 px-4 rounded-md text-white font-medium ${
              product.isAvailable 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {product.isAvailable ? 'Add to Cart' : 'Unavailable'}
          </button>
        )}
      </div>
    </div>
  );
}