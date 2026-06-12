import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pesanan",
  description: "Status pesanan kamu di SAGANSA Web Order",
  robots: {
    index: false,
    follow: true,
  },
};

export default function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}