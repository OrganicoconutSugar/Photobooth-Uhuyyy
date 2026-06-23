const API_BASE = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_URL || 'https://photobooth-uhuyyy-production.up.railway.app');

export function apiUrl(path) {
  if (!path.startsWith('/')) path = '/' + path;
  return `${API_BASE}${path}`;
}
