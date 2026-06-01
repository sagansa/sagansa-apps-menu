'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const formatCurrency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;
const getPaymentStatus = (status: string, payment: string) => {
  if (['paid', 'success', 'completed'].includes(status.toLowerCase())) {
    return {
      label: 'Pembayaran berhasil',
      className: 'bg-green-100 text-green-700',
    };
  }

  if (payment.toLowerCase() === 'bayar di kasir') {
    return {
      label: 'Pending',
      className: 'bg-blue-100 text-blue-700',
    };
  }

  return {
    label: 'Menunggu approval kasir/admin',
    className: 'bg-amber-100 text-amber-700',
  };
};

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const total = Number(searchParams.get('total') ?? 0);
  const payment = searchParams.get('payment') ?? 'Bayar di Kasir';
  const paymentStatus = getPaymentStatus(searchParams.get('paymentStatus') ?? 'pending', payment);
  const returnUrl = searchParams.get('returnUrl') || '/';
  const isPayAtCounter = payment.toLowerCase() === 'bayar di kasir';

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <section className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl font-bold text-green-700">
          ✓
        </div>
        <h1 className="mt-5 text-2xl font-bold text-gray-900">Pesanan berhasil dikirim</h1>
        <p className="mt-2 text-sm text-gray-600">
          {isPayAtCounter
            ? 'Segera ke kasir untuk melakukan pembayaran.'
            : 'Silakan tunggu, pesanan akan segera diproses.'}
        </p>

        <div className="mt-6 space-y-3 rounded-lg border border-gray-200 p-4 text-left text-sm">
          {orderId && (
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Order</span>
              <span className="font-medium text-gray-900">#{orderId.slice(0, 8)}</span>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Pembayaran</span>
            <span className="font-medium text-gray-900">{payment}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-500">Status Pembayaran</span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentStatus.className}`}>
              {paymentStatus.label}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-500">Status Pesanan</span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              Berhasil dikirim
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold text-gray-900">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-2">
          <Link
            href={returnUrl}
            className="rounded-md bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Kembali ke Menu
          </Link>
          <Link
            href={`${returnUrl}#profile`}
            className="rounded-md border border-gray-200 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Lihat Pesanan Saya
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={null}>
      <OrderSuccessContent />
    </Suspense>
  );
}
