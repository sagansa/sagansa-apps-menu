'use client';

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, variantId?: string, modifications?: { id: string; quantity: number }[]) => void;
}

const formatCurrency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

const getInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('');
  return initials || 'P';
};

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(undefined);
  const [selectedModifications, setSelectedModifications] = useState<{ id: string; quantity: number }[]>([]);
  const [variantError, setVariantError] = useState('');

  const selectedPrice = useMemo(() => {
    const variant = selectedVariant ? product.variants?.find((item) => item.id === selectedVariant) : undefined;
    return variant?.price ?? product.price;
  }, [product.price, product.variants, selectedVariant]);

  const modificationsTotal = selectedModifications.reduce((sum, item) => {
    const modification = product.modifications?.find((mod) => mod.id === item.id);
    return sum + (modification?.price ?? 0);
  }, 0);

  const finalPrice = selectedPrice + modificationsTotal;
  const hasOptions = Boolean(product.variants?.length || product.modifications?.length);
  const variantRequired = Boolean(product.variants?.length);

  const variantLabel = useMemo(() => {
    const firstVariant = product.variants?.[0]?.name;
    if (!firstVariant?.includes(':')) {
      return 'Pilihan';
    }

    return firstVariant.split(':')[0].trim();
  }, [product.variants]);

  const getVariantDisplayName = (name: string) => {
    if (!name.includes(':')) {
      return name;
    }

    return name.split(':').slice(1).join(':').trim();
  };

  const resetSelection = () => {
    setSelectedVariant(undefined);
    setSelectedModifications([]);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setVariantError('');
    resetSelection();
  };

  const toggleModification = (modificationId: string) => {
    setSelectedModifications((current) => {
      const exists = current.some((item) => item.id === modificationId);
      return exists
        ? current.filter((item) => item.id !== modificationId)
        : [...current, { id: modificationId, quantity: 1 }];
    });
  };

  const handleAddToCart = () => {
    if (variantRequired && !selectedVariant) {
      setVariantError(`${variantLabel} wajib dipilih.`);
      return;
    }

    onAddToCart?.(product, selectedVariant, selectedModifications);
    closeDetail();
  };

  const openDetail = () => {
    setIsDetailOpen(true);
  };

  return (
    <>
      <article
        role="button"
        tabIndex={0}
        onClick={openDetail}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openDetail();
          }
        }}
        className="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-slate-100">
            <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-600 text-2xl font-bold text-white sm:h-20 sm:w-20 sm:text-3xl">
              {getInitials(product.name)}
            </span>
          </div>
        )}

        <div className="p-3 sm:p-4">
          <h3 className="min-h-10 overflow-hidden text-sm font-semibold leading-5 text-gray-900 sm:text-base">
            {product.name}
          </h3>
          {!product.isAvailable && (
            <p className="mt-2 text-xs font-medium text-gray-500">Unavailable</p>
          )}
        </div>
      </article>

      {isDetailOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeDetail} />

          <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold text-gray-900">{product.name}</h2>
                {product.category && <p className="text-sm text-gray-500">{product.category}</p>}
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close product detail"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-56 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-56 w-full items-center justify-center rounded-lg bg-slate-100">
                  <span className="flex h-28 w-28 items-center justify-center rounded-lg bg-blue-600 text-4xl font-bold text-white">
                    {getInitials(product.name)}
                  </span>
                </div>
              )}

              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(finalPrice)}</div>
                  {!product.isAvailable && <p className="mt-1 text-sm font-medium text-gray-500">Unavailable</p>}
                </div>
                {hasOptions && <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">Customizable</span>}
              </div>

              {product.description && (
                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  <div className="text-sm font-semibold text-gray-900">Description</div>
                  <p className="mt-1 text-sm leading-6 text-gray-600">{product.description}</p>
                </div>
              )}

              {product.variants && product.variants.length > 0 && (
                <section className="mt-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold capitalize text-gray-900">{variantLabel}</h3>
                    <span className="text-xs font-medium text-red-600">Wajib</span>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {product.variants.map((variant) => (
                      <button
                        type="button"
                        key={variant.id}
                        disabled={!variant.isAvailable}
                        onClick={() => {
                          setSelectedVariant(selectedVariant === variant.id ? undefined : variant.id);
                          setVariantError('');
                        }}
                        className={`flex items-center justify-between rounded-md border px-3 py-3 text-left text-sm transition-colors ${
                          selectedVariant === variant.id
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-700 hover:border-blue-200 hover:bg-blue-50/50'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        <span>{getVariantDisplayName(variant.name)}</span>
                        <span className="font-semibold">{formatCurrency(variant.price)}</span>
                      </button>
                    ))}
                  </div>
                  {variantError && <p className="mt-2 text-xs text-red-600">{variantError}</p>}
                </section>
              )}

              {product.modifications && product.modifications.length > 0 && (
                <section className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-900">Add-ons</h3>
                  <div className="mt-3 space-y-2">
                    {product.modifications.map((modification) => {
                      const selected = selectedModifications.some((item) => item.id === modification.id);

                      return (
                        <div key={modification.id} className="rounded-md border border-gray-200 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <label className="flex min-w-0 items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selected}
                                disabled={!modification.isAvailable}
                                onChange={() => toggleModification(modification.id)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium text-gray-900">{modification.name}</span>
                                <span className="text-sm text-gray-500">+{formatCurrency(modification.price)}</span>
                              </span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            {onAddToCart && (
              <div className="border-t border-gray-200 p-5">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!product.isAvailable}
                  className={`w-full rounded-md px-4 py-3 font-semibold text-white transition-colors ${
                    product.isAvailable
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'cursor-not-allowed bg-gray-400'
                  }`}
                >
                  {product.isAvailable ? 'Add to Cart' : 'Unavailable'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
