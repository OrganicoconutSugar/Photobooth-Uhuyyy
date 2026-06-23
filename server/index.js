import express from 'express';
import cors from 'cors';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { router as authRouter } from './auth.js';
import { router as sessionsRouter } from './sessions.js';
import { router as adminRouter } from './admin.js';
import { seedAdmin } from './seed.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = resolve(__dirname, '..', 'dist');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve built frontend in production
if (existsSync(distPath)) {
  app.use(express.static(distPath));
}

app.use('/api/auth', authRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/admin', adminRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SPA fallback — serve frontend for all non-API routes
app.use((req, res) => {
  if (req.method !== 'GET') {
    return res.status(404).json({ error: 'Not found' });
  }
  if (existsSync(distPath)) {
    res.sendFile(resolve(distPath, 'index.html'));
  } else {
    res.status(200).json({
      message: 'Photobooth API is running',
      frontend: 'http://localhost:5173',
      note: 'Run npm run dev and open the Vite URL above'
    });
  }
});

try {
  seedAdmin();
} catch (err) {
  console.error('[seed] Failed:', err.message);
}

const server = app.listen(PORT, () => {
  console.log('');
  console.log(`  🔌 Photobooth API    → http://localhost:${PORT}`);
  console.log(`  🌐 Frontend (Vite)   → http://localhost:5173`);
  console.log(`  📱 Buka URL Frontend di browser, BUKAN port ${PORT}`);
  console.log('');
});

server.on('error', (err) => {
  console.error(`[server] Failed on port ${PORT}:`, err.message, '- Vite proxy will return 502 for API calls');
});
