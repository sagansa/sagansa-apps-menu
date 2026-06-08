const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001/api';
const STORAGE_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_BASE_URL;

function getApiOrigin(): string {
  try {
    if (API_BASE_URL.startsWith('/')) {
      return typeof window !== 'undefined' ? window.location.origin : '';
    }

    return new URL(API_BASE_URL).origin;
  } catch {
    return '';
  }
}

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

  const apiOrigin = getApiOrigin();
  if (!apiOrigin) {
    return `/${normalizedStoragePath}`;
  }

  return `${apiOrigin}/storage/${normalizedStoragePath}`;
}
