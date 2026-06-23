const API_BASE = 'https://photobooth-uhuyyy-production.up.railway.app';

export function apiUrl(path) {
  if (!path.startsWith('/')) path = '/' + path;
  return `${API_BASE}${path}`;
}
