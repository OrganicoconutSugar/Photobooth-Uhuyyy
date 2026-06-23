import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './db.js';
import { authMiddleware } from './auth.js';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  const sessions = db.prepare(
    'SELECT id, images, frame_template, created_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);
  res.json({ sessions: sessions.map(s => ({ ...s, images: JSON.parse(s.images) })) });
});

router.post('/', authMiddleware, (req, res) => {
  const { images, frame_template } = req.body;
  if (!images || !Array.isArray(images)) {
    return res.status(400).json({ error: 'Images array required' });
  }

  const db = getDb();
  const id = uuidv4();
  db.prepare(
    'INSERT INTO sessions (id, user_id, images, frame_template) VALUES (?, ?, ?, ?)'
  ).run(id, req.user.id, JSON.stringify(images), frame_template || 'classic');

  res.json({
    session: { id, images, frame_template: frame_template || 'classic', created_at: new Date().toISOString() },
  });
});

router.delete('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const session = db.prepare('SELECT id, user_id FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id);
  res.json({ message: 'Session deleted' });
});

export { router };
