import { Router } from 'express';
import { getDb } from './db.js';
import { authMiddleware, adminMiddleware } from './auth.js';

const router = Router();

router.get('/users', authMiddleware, adminMiddleware, (req, res) => {
  const db = getDb();
  const users = db.prepare(
    'SELECT id, username, email, role, bio, avatar, created_at, last_login FROM users ORDER BY created_at DESC'
  ).all();
  const counts = db.prepare(
    'SELECT user_id, COUNT(*) as count FROM sessions GROUP BY user_id'
  ).all();
  const countMap = {};
  counts.forEach(c => { countMap[c.user_id] = c.count; });

  res.json({
    users: users.map(u => ({ ...u, session_count: countMap[u.id] || 0 })),
  });
});

router.get('/users/:id/sessions', authMiddleware, adminMiddleware, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const sessions = db.prepare(
    `SELECT id, images, frame_template, created_at
     FROM sessions WHERE user_id = ?
     ORDER BY created_at DESC`
  ).all(req.params.id);

  res.json({ sessions: sessions.map(s => ({ ...s, images: JSON.parse(s.images) })) });
});

// Cleanup: hapus token expired + VACUUM
router.post('/cleanup', authMiddleware, adminMiddleware, (req, res) => {
  const db = getDb();
  const deleted = db.prepare(
    "DELETE FROM password_resets WHERE expires_at < datetime('now')"
  ).run();
  db.pragma('page_size = 4096');
  db.exec('VACUUM');
  res.json({
    message: 'Bersih!',
    deleted_tokens: deleted.changes,
  });
});

// Hapus user tertentu by ID
router.delete('/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
  res.json({ message: `User ${user.username} deleted` });
});

// Hapus user yang tidak aktif dalam X hari
router.delete('/users/inactive/:days', authMiddleware, adminMiddleware, (req, res) => {
  const days = parseInt(req.params.days, 10);
  if (isNaN(days) || days < 1) return res.status(400).json({ error: 'Invalid days' });
  const db = getDb();
  const users = db.prepare(
    `SELECT id, username, email, last_login FROM users
     WHERE role != 'admin'
       AND (last_login IS NULL OR last_login < datetime('now', ? || ' days'))
       AND id != ?`
  ).all(`-${days}`, req.user.id);
  const ids = users.map(u => u.id);
  if (ids.length > 0) {
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`DELETE FROM users WHERE id IN (${placeholders})`).run(...ids);
  }
  res.json({
    message: `${users.length} user(s) deleted`,
    deleted_users: users.map(u => ({ username: u.username, email: u.email, last_login: u.last_login })),
  });
});

export { router };
