// src/utils/imageUrl.js
const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1200&auto=format&fit=crop';

/**
 * Resolves a property image URL to a full, loadable path in any environment (dev, staging, production).
 */
export function getImageUrl(pathOrUrl) {
  if (!pathOrUrl) return DEFAULT_FALLBACK;
  if (typeof pathOrUrl !== 'string') return DEFAULT_FALLBACK;

  const trimmed = pathOrUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Determine backend host from REACT_APP_API_URL or window.location
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const backendBase = apiUrl.replace(/\/api\/?$/, '');

  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${backendBase}${cleanPath}`;
}

export { DEFAULT_FALLBACK };
