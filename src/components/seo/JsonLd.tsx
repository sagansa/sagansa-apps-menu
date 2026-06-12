interface JsonLdProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://menu.sagansa.id";

export function WebsiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Web Order by Sagansa",
    description:
      "Pesan menu makanan & minuman langsung dari HP kamu. Sistem pemesanan online untuk restoran, kafe, dan bisnis F&B.",
    url: SITE_URL,
    potentialAction: {
      "@type": "OrderAction",
      target: SITE_URL,
      name: "Pesan Makanan Online",
    },
    publisher: {
      "@type": "Organization",
      name: "SAGANSA",
      url: "https://sagansa.id",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/og-image.png`,
      },
    },
  };

  return <JsonLd data={data} />;
}

interface RestaurantJsonLdProps {
  name: string;
  description?: string;
  phone?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  url?: string;
}

export function RestaurantJsonLd({
  name,
  description,
  phone,
  latitude,
  longitude,
  url,
}: RestaurantJsonLdProps) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name,
    description: description || `Menu ${name} - Pesan langsung via SAGANSA`,
    url: url || SITE_URL,
    servesCuisine: ["Indonesian", "Asian"],
    acceptsReservations: "false",
    hasMenu: {
      "@type": "Menu",
      url: url || SITE_URL,
    },
    orderingMode: {
      "@type": "OrderDeliveryMode",
      name: "Dine-in / Takeaway",
    },
  };

  if (phone) {
    data.telephone = phone;
  }

  if (latitude && longitude) {
    data.geo = {
      "@type": "GeoCoordinates",
      latitude: Number(latitude),
      longitude: Number(longitude),
    };
  }

  return <JsonLd data={data} />;
}

interface BreadcrumbJsonLdProps {
  items: { name: string; url: string }[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLd data={data} />;
}