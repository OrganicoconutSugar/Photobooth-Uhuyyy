const SESSIONS_KEY = 'photobooth.sessions.v1';
const MAX_SESSIONS = 10;

export function loadSessions() {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveSession({ id, images, createdAt }) {
  const current = loadSessions();
  const next = [{ id, images, createdAt }, ...current].slice(0, MAX_SESSIONS);
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(next));
    return { ok: true, count: next.length };
  } catch {
    const trimmed = next.slice(0, 3);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed));
    return { ok: false, error: 'QUOTA_EXCEEDED', count: trimmed.length };
  }
}

export function deleteSession(id) {
  const next = loadSessions().filter((s) => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(next));
  return next;
}

export function clearAllSessions() {
  localStorage.removeItem(SESSIONS_KEY);
}
