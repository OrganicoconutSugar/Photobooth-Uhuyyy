import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './db.js';

export function seedAdmin() {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (existing) {
    console.log('[seed] Admin user already exists');
    return;
  }

  const id = uuidv4();
  const username = 'admin';
  const email = 'admin@photobooth.app';
  const password = 'admin123';
  const hash = bcrypt.hashSync(password, 10);

  db.prepare(
    'INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)'
  ).run(id, username, email, hash, 'admin');

  console.log('[seed] Admin user created: admin@photobooth.app / admin123');
}
