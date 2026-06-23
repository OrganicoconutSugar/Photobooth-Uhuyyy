# PHOTOBOOTH — Project Context

> File ini dibaca otomatis oleh Claude Code di awal setiap sesi.
> Update file ini setiap kali pekerjaan selesai agar konteks tidak hilang.

## 📌 Project Overview

**photobooth** — free online photobooth web app (UI overhaul v2).
Tema: **Sage Maximalist** — white + sage green, ornamental borders, botanical decorative elements.

- Palet: sage-50 `#F8F9F6` → sage-800 `#2D3A2D`, primary sage-500 `#9CAF88`
- Maximalist UI: ornamental CSS borders, layered depth, decorative SVGs, rich textures
- Font: Geist (sans-serif utama), Inter (fallback), JetBrains Mono (mono), Playfair Display (decorative accent)
- Versi: `v2.0.0`

## 🛠 Tech Stack

| Layer        | Tool                              |
| ------------ | --------------------------------- |
| Frontend     | React 19.2.6                      |
| Bundler      | Vite 8.0.12                       |
| Routing      | React Router 6.30.4               |
| Styling      | Tailwind CSS 3.4.17 + PostCSS     |
| Backend      | Express 5 (ESM)                   |
| Database     | SQLite (better-sqlite3)           |
| Auth         | bcryptjs + jsonwebtoken           |
| Lint         | ESLint 10.3.0                     |
| Bahasa       | JavaScript (ESM, no TypeScript)   |

## 📂 File Structure

```
photobooth-app/
├── server/
│   ├── index.js        # Express entry (port 3001), mounts routers + seed
│   ├── db.js           # SQLite init + schema (users, sessions, password_resets)
│   ├── auth.js         # Register/login/me/profile/forgot-reset + JWT middleware
│   ├── sessions.js     # CRUD for user photobooth sessions
│   ├── admin.js        # Admin endpoints: list users + per-user sessions (no delete)
│   └── seed.js         # Seeds admin user on first start
├── src/
│   ├── App.jsx              # AuthProvider + BrowserRouter + routes + modals
│   ├── main.jsx             # Entry (StrictMode)
│   ├── index.css            # Tailwind + utilities (glass-sage, ornament-border)
│   ├── context/
│   │   └── AuthContext.jsx  # Auth state provider + useAuth() hook
│   ├── components/
│   │   ├── Sidebar.jsx      # Glassmorphism sage NavBar with modals
│   │   └── AccountMenu.jsx  # Avatar dropdown (profil/admin/keluar)
│   ├── pages/
│   │   ├── Beranda.jsx      # Maximalist hero with decorative leaf SVG
│   │   ├── Kamera.jsx       # Camera capture + filters + filmstrip + server save
│   │   ├── Gallery.jsx      # User's saved sessions from server API
│   │   ├── Templates.jsx    # 6 frame template styles grid
│   │   ├── Login.jsx        # 3-mode auth (login/register/forgot)
│   │   ├── Account.jsx      # Edit username/bio, logout
│   │   └── Admin.jsx        # Admin panel: user list (email, created, last_login, click to view gallery)
│   ├── lib/
│   │   └── galleryStore.js  # localStorage fallback CRUD (key: photobooth.sessions.v1, max 10)
│   └── assets/
└── eslint.config.js         # Flat config (browser + node envs)
```

## 🗺 Routes

| Path         | Page       | Catatan                                        |
| ------------ | ---------- | ---------------------------------------------- |
| `/`          | Beranda    | Maximalist hero + CTA "Mulai Berfoto"          |
| `/kamera`    | Kamera     | Webcam/simulated, filter, countdown, strip     |
| `/kamera?template=id` | Kamera | Frame template dari halaman Templates          |
| `/gallery`   | Gallery    | User's sessions from server API                |
| `/templates` | Templates  | 6 frame styles to pick before capture          |
| `/login`     | Login      | Login/Register/Lupa Password                   |
| `/account`   | Account    | Edit profile (username, bio)                   |
| `/admin`     | Admin      | Admin panel (users + sessions management) — admin tidak bisa akses kamera      |
| `*`          | → `/`      | Redirect                                       |

## ✅ Fitur yang sudah jalan

- [x] **Sage Maximalist theme** — white + sage green palette, ornamental CSS borders, botanical leaf SVG
- [x] **Glassmorphism sage NavBar** — home, kamera, gallery, templates + modal buttons (tentang, privasi, kontak)
- [x] **Account menu** — avatar dropdown dgn profil/admin/keluar (muncul jika login)
- [x] **Auth system** — register, login, forgot-password/reset via Express + SQLite, JWT (7 hari)
- [x] **Landing page** — decorative leaf SVG, rotating photo strip, maximalist CTA
- [x] **Kamera capture** via `getUserMedia` (640×480, facingMode user)
- [x] **Simulated camera mode** — fallback saat izin denied (4 Unsplash portraits)
- [x] **4 filter gaya** — normal, retro-bw, warm-vintage, neon-vibe
- [x] **Countdown 3 detik** sebelum capture
- [x] **Flash overlay effect** saat jepret
- [x] **4-slot filmstrip preview** — realtime preview setelah tiap capture
- [x] **Download composite strip** — 4 foto + watermark dalam 1 PNG (400×1200)
- [x] **Auto save ke server DB** setelah download (via POST /api/sessions)
- [x] **LocalStorage fallback** — saveSession ke galleryStore juga
- [x] **Reset strip** — hapus semua foto dari sesi
- [x] **Toast notification** — custom non-blocking alert
- [x] **Session storage** — galleryStore.js untuk localStorage + server DB via API
- [x] **Gallery viewer** — grid user sessions dari server, hapus individual
- [x] **Admin panel** — lihat semua users & sessions, hapus (admin@photobooth.app / admin123)
- [x] **Account page** — edit username & bio, email read-only, logout
- [x] **Template selection** — 6 frame styles grid, pilih sebelum kamera
- [x] **3 modal overlay** — tentang, privasi, kontak (backdrop-blur)
- [x] **Mobile responsive** — layout grid collapse, stacked on mobile
- [x] **Build & lint clean** (zero errors/warnings)
- [x] **Express SPA fallback** — serve frontend + React Router via Express (dist/ or helpful message)
- [x] **last_login tracking** — kolom + update timestamp saat login
- [x] **Admin: user list saja** — tabel email, foto count, created_at, last_login; klik lihat gallery user
- [x] **Admin no kamera** — kamera disembunyikan di sidebar + redirect ke /admin
- [x] **Server no process.exit** — error handler tidak bunuh Vite

## 🎨 Design Tokens (Tailwind)

- `sage-50: #F8F9F6` (bg base)
- `sage-100: #EFF1EC` (light bg)
- `sage-200: #DDE2D8` (borders)
- `sage-300: #C4CCBB` (muted)
- `sage-400: #A8B59C` (secondary text)
- `sage-500: #9CAF88` (brand primary)
- `sage-600: #7A9276` (hover)
- `sage-700: #5A6E56` (active)
- `sage-800: #2D3A2D` (text, headings)

Custom classes di `index.css`:
- `.glass-sage` — backdrop-blur + sage-tinted glass
- `.ornament-border` — CSS pseudo-element corner ornaments
- `.sage-gradient` — muted sage radial gradient bg
- `.flash-overlay` — white flash animation
- `.ornament-lg`, `.frame-sage`, `.shadow-sage-*`, `.ornament-heading`, `.bg-sage-dots` — maximalist utilities

## 🔄 Script

```bash
npm run dev      # concurrently: Vite + Express (port 3001)
npm run build    # Build frontend ke dist/
npm run preview  # Preview build
npm run lint     # ESLint (browser + node configs)
```

## 🎯 Possible Next Steps

- Device selector dropdown untuk ganti kamera
- Layout asimetris untuk strip (mode `minimalist`)
- Web Share API untuk bagikan hasil
- Sound effect saat capture
- Animasi transisi antar halaman
- PWA manifest + service worker
- Dark mode toggle

---

**Cara memperbarui memory ini:** Edit file ini langsung saat pekerjaan selesai. File ini otomatis di-load di awal setiap sesi baru.
