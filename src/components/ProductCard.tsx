'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Product } from '@/types';
import { resolveImageUrl } from '@/lib/images';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  onAddToCart?: (product: Product, variantId?: string, modifications?: { id: string; quantity: number }[]) => void;
}

const formatCurrency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

const getInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('');
  return initials || 'P';
};

const getStockLabel = (product: Product) => {
  if (product.remaining === false || product.stock === undefined) {
    return null;
  }

  return product.stock > 0 ? `Stok: ${product.stock}` : 'Stok habis';
};

/**
 * Estimated bundle stock = min(component stock / required qty) across components
 * that track stock. Mirrors backend `bundle_available_stock` and the POS modal
 * logic. Returns undefined when no component tracks stock.
 */
const getBundleAvailableStock = (product: Product): number | undefined => {
  if (product.type !== 'bundle' || !product.bundleItems?.length) {
    return undefined;
  }

  const candidates: number[] = [];

  if (typeof product.stock === 'number' && product.remaining !== false) {
    candidates.push(product.stock);
  }

  product.bundleItems.forEach((item) => {
    const component = item.componentProduct;
    if (!component || component.remaining !== true || component.stock == null) {
      return;
    }

    const required = Math.max(1, item.quantity || 1);
    candidates.push(Math.floor(Number(component.stock) / required));
  });

  if (candidates.length === 0) {
    return undefined;
  }

  return Math.max(0, Math.min(...candidates));
};

export function ProductCard({ product, onAddToCart, viewMode = 'grid' }: ProductCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(undefined);
  const [selectedModifications, setSelectedModifications] = useState<{ id: string; quantity: number }[]>([]);
  const [variantError, setVariantError] = useState('');
  const [imageFailed, setImageFailed] = useState(false);

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
  const isBundle = product.type === 'bundle';
  const imageSrc = resolveImageUrl(product.image);
  const hasImage = Boolean(imageSrc && !imageFailed);
  const stockLabel = getStockLabel(product);
  const tracksStock = product.remaining !== false && product.stock !== undefined;
  const isOutOfStock = tracksStock && (product.stock ?? 0) <= 0;
  const isAvailable = product.isAvailable !== false && !isOutOfStock;

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

  useEffect(() => {
    setImageFailed(false);
  }, [imageSrc]);

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
        tabIndex={isOutOfStock ? -1 : 0}
        onClick={isOutOfStock ? undefined : openDetail}
        onKeyDown={(event) => {
          if (isOutOfStock) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openDetail();
          }
        }}
        aria-disabled={isOutOfStock}
        className={`group relative flex flex-col overflow-hidden rounded-xl border border-brand-100 bg-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${
          isOutOfStock ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md'
        }`}
      >
        {/* Media */}
        <div className={`relative ${viewMode === 'list' ? 'aspect-square' : 'aspect-[4/3]'}`}>
          {hasImage ? (
            <img
              src={imageSrc}
              alt={product.name}
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand-50">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-500 text-base font-bold text-white">
                {getInitials(product.name)}
              </span>
            </div>
          )}

          {isOutOfStock && (
            <span className="absolute left-1.5 top-1.5 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
              Habis
            </span>
          )}

          {/* Quick add button (inline on card, only for products without options) */}
          {!isOutOfStock && onAddToCart && !hasOptions && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onAddToCart(product);
              }}
              className="absolute bottom-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white shadow-md transition hover:bg-brand-600 active:scale-95"
              aria-label={`Tambah ${product.name} ke keranjang`}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-2 p-2.5">
          <h3 className="line-clamp-2 min-h-[2.4em] text-[13px] font-semibold leading-tight text-gray-900">
            {product.name}
          </h3>
          <div className="mt-auto flex items-end justify-between gap-2">
            {stockLabel ? (
              <span className={`text-[11px] font-semibold leading-tight ${isOutOfStock ? 'text-red-600' : 'text-emerald-600'}`}>
                {stockLabel}
              </span>
            ) : (
              <span />
            )}
            <span className="text-sm font-extrabold leading-tight text-brand-600">{formatCurrency(product.price)}</span>
          </div>
        </div>
      </article>

      {isDetailOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeDetail} />

          <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-bold text-gray-900">{product.name}</h2>
                  {isBundle && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      Paket
                    </span>
                  )}
                </div>
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
              {hasImage ? (
                <img
                  src={imageSrc}
                  alt={product.name}
                  onError={() => setImageFailed(true)}
                  className="h-56 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-56 w-full items-center justify-center rounded-lg bg-slate-100">
                  <span className="flex h-28 w-28 items-center justify-center rounded-lg bg-brand-500 text-4xl font-bold text-white">
                    {getInitials(product.name)}
                  </span>
                </div>
              )}

              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-2xl font-bold text-brand-600">{formatCurrency(finalPrice)}</div>
                  {stockLabel && (
                    <p className={`mt-1 text-sm font-medium ${isOutOfStock ? 'text-red-600' : 'text-emerald-700'}`}>
                      {stockLabel}
                    </p>
                  )}
                </div>
                {hasOptions && <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">Customizable</span>}
              </div>

              {product.description && (
                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  <div className="text-sm font-semibold text-gray-900">Description</div>
                  <p className="mt-1 text-sm leading-6 text-gray-600">{product.description}</p>
                </div>
              )}

              {isBundle && (
                <section className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-gray-900">Isi Paket</div>
                    {(() => {
                      const bundleStock = getBundleAvailableStock(product);
                      if (bundleStock === undefined) {
                        return null;
                      }
                      const isOutOfStock = bundleStock <= 0;
                      return (
                        <span className={`text-xs font-bold ${isOutOfStock ? 'text-red-600' : 'text-gray-500'}`}>
                          {isOutOfStock ? 'Stok paket habis' : `Stok paket ${bundleStock}`}
                        </span>
                      );
                    })()}
                  </div>
                  {product.bundleItems && product.bundleItems.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {product.bundleItems.map((item) => {
                        const component = item.componentProduct;
                        const tracksStock = component?.remaining === true;
                        const componentStock = component?.stock;
                        const hasStockValue = tracksStock && componentStock != null;
                        // Is this component the bottleneck for the current quantity (1)?
                        const required = Math.max(1, item.quantity || 1);
                        const isInsufficient = hasStockValue && Number(componentStock) < required;

                        return (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between gap-3 text-sm ${isInsufficient ? 'opacity-60' : ''}`}
                          >
                            <span className={`min-w-0 flex-1 truncate ${isInsufficient ? 'text-red-600' : 'text-gray-700'}`}>
                              {component?.name || 'Produk'}
                            </span>
                            <span className="flex shrink-0 items-center gap-3">
                              {hasStockValue && (
                                <span className={`text-xs font-medium ${isInsufficient ? 'text-red-600' : 'text-gray-500'}`}>
                                  Stok {componentStock}
                                </span>
                              )}
                              <span className={`font-medium ${isInsufficient ? 'text-red-600' : 'text-gray-900'}`}>x{item.quantity}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">Detail isi paket belum tersedia.</p>
                  )}
                </section>
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
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-gray-200 text-gray-700 hover:border-brand-200 hover:bg-brand-50/50'
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
                      const linkedStock = modification.linkedProduct?.stock;

                      return (
                        <div key={modification.id} className="rounded-md border border-gray-200 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <label className="flex min-w-0 items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selected}
                                disabled={!modification.isAvailable}
                                onChange={() => toggleModification(modification.id)}
                                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                              />
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-medium text-gray-900">{modification.name}</span>
                                  {modification.linkedProduct ? (
                                    <span className="block truncate text-xs text-gray-500">
                                      Stok {modification.linkedProduct.name}: {linkedStock ?? '-'}
                                    </span>
                                  ) : null}
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
                  disabled={!isAvailable}
                  className={`w-full rounded-md px-4 py-3 font-semibold text-white transition-colors ${
                    isAvailable
                      ? 'bg-brand-500 hover:bg-brand-600'
                      : 'cursor-not-allowed bg-gray-400'
                  }`}
                >
                  {isAvailable
                    ? 'Tambah ke Keranjang'
                    : (isOutOfStock ? 'Stok habis' : 'Tidak tersedia')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
