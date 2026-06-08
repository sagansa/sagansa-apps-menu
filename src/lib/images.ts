const STORAGE_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_BASE_URL;

function normalizeStoragePath(imagePath: string): string {
  const cleanPath = imagePath.replace(/^\/?(storage\/)?/, '');

  if (cleanPath.startsWith('products/')) {
    return cleanPath;
  }

  return cleanPath.includes('/') ? cleanPath : `products/${cleanPath}`;
}

export function resolveImageUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const imagePath = value.trim();
  if (!imagePath) {
    return undefined;
  }

  if (/^(https?:)?\/\//.test(imagePath) || imagePath.startsWith('data:') || imagePath.startsWith('blob:')) {
    return imagePath;
  }

  const normalizedStoragePath = normalizeStoragePath(imagePath);

  if (STORAGE_BASE_URL) {
    return `${STORAGE_BASE_URL.replace(/\/$/, '')}/${normalizedStoragePath}`;
  }

  if (typeof window === 'undefined') {
    return `/${normalizedStoragePath}`;
  }

  return `${window.location.origin}/storage/${normalizedStoragePath}`;
}
