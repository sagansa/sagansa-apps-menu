'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function OrderFailedPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'Pesanan gagal dikirim. Silakan coba lagi.';
  const returnUrl = searchParams.get('returnUrl') || '/';

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <section className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-700">
          !
        </div>
        <h1 className="mt-5 text-2xl font-bold text-gray-900">Pesanan gagal dikirim</h1>
        <p className="mt-2 text-sm text-gray-600">
          {message}
        </p>

        <div className="mt-6 grid gap-2">
          <Link
            href={returnUrl}
            className="rounded-md bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Coba Lagi
          </Link>
          <Link
            href="/"
            className="rounded-md border border-gray-200 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Kembali
          </Link>
        </div>
      </section>
    </main>
  );
}
