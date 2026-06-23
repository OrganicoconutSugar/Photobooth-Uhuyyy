import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'photobooth-sage-secret-key';

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: admin only' });
  }
  next();
}

router.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
  if (existing) {
    return res.status(409).json({ error: 'Email or username already exists' });
  }

  const id = uuidv4();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)'
  ).run(id, username, email, hash);

  const token = jwt.sign({ id, username, email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id, username, email, role: 'user', bio: '', avatar: '' } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  db.prepare(`UPDATE users SET last_login = datetime('now') WHERE id = ?`).run(user.id);

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role, bio: user.bio || '', avatar: user.avatar || '' },
  });
});

router.get('/me', authMiddleware, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, username, email, role, bio, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

router.put('/profile', authMiddleware, (req, res) => {
  const { username, bio, avatar } = req.body;
  const db = getDb();

  if (username) {
    const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, req.user.id);
    if (existing) return res.status(409).json({ error: 'Username already taken' });
    db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, req.user.id);
  }
  if (bio !== undefined) {
    db.prepare('UPDATE users SET bio = ? WHERE id = ?').run(bio, req.user.id);
  }
  if (avatar !== undefined) {
    db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar, req.user.id);
  }

  const user = db.prepare('SELECT id, username, email, role, bio, avatar FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'Email not found' });

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 3600000).toISOString();
  db.prepare(
    'INSERT INTO password_resets (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
  ).run(uuidv4(), user.id, token, expiresAt);

  res.json({ message: 'Reset token created (demo mode)', token });
});

router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required' });

  const db = getDb();
  const reset = db.prepare(
    'SELECT * FROM password_resets WHERE token = ? AND expires_at > datetime("now")'
  ).get(token);
  if (!reset) return res.status(400).json({ error: 'Invalid or expired token' });

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, reset.user_id);
  db.prepare('DELETE FROM password_resets WHERE token = ?').run(token);

  res.json({ message: 'Password reset successful' });
});

export { router };
