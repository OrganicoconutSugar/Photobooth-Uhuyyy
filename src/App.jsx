import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import NavBar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Beranda from './pages/Beranda';
import Kamera from './pages/Kamera';
import Gallery from './pages/Gallery';
import Templates from './pages/Templates';
import Login from './pages/Login';
import Account from './pages/Account';
import Admin from './pages/Admin';

const MODALS = {
  about: {
    title: 'Tentang Photobooth',
    body: 'Aplikasi web photobooth gratis untuk membuat strip foto digital. Semua proses 100% di browser atau tersimpan di akun kamu.',
  },
  privacy: {
    title: 'Kebijakan Privasi',
    body: 'Data kamu aman. Foto diproses lokal di browser. Saat login, data session tersimpan di database kami dengan enkripsi.',
  },
};

function Modal({ id, onClose }) {
  const modal = MODALS[id];
  if (!modal) return null;

  return (
    <div
      className="fixed inset-0 bg-sage-800/30 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-sage-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-sage-800 mb-4">{modal.title}</h3>
        <p className="text-sm text-sage-600 leading-relaxed mb-6">{modal.body}</p>
        <button
          onClick={onClose}
          className="w-full py-3 bg-sage-700 hover:bg-sage-800 text-white rounded-full text-sm font-semibold tracking-wider transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

function App() {
  const [activeModal, setActiveModal] = useState(null);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen sage-gradient bg-sage-dots flex flex-col relative">
          {/* Decorative botanical corner accents */}
          <svg className="fixed top-8 left-8 w-16 h-16 text-sage-300/20 pointer-events-none hidden lg:block" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M8 56 Q8 28 28 12 Q44 4 56 8" strokeLinecap="round" />
            <path d="M8 56 Q12 52 20 44" strokeLinecap="round" />
            <path d="M56 8 Q48 12 44 20" strokeLinecap="round" />
            <path d="M16 48 Q24 36 36 28" strokeLinecap="round" opacity="0.5" />
          </svg>
          <svg className="fixed bottom-8 right-8 w-20 h-20 text-sage-300/20 pointer-events-none hidden lg:block rotate-180" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M8 56 Q8 28 28 12 Q44 4 56 8" strokeLinecap="round" />
            <path d="M8 56 Q12 52 20 44" strokeLinecap="round" />
            <path d="M56 8 Q48 12 44 20" strokeLinecap="round" />
            <path d="M16 48 Q24 36 36 28" strokeLinecap="round" opacity="0.5" />
          </svg>

          <NavBar onOpenModal={setActiveModal} />

          <main className="flex-1 flex flex-col px-4 md:px-8 py-6 relative z-10">
            <Routes>
              <Route path="/" element={<Beranda />} />
              <Route path="/kamera" element={<ProtectedRoute><Kamera /></ProtectedRoute>} />
              <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
              <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/account" element={<Account />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer className="w-full py-8 text-center text-xs text-sage-400 mt-auto border-t border-sage-200/40 relative z-10">
            <div className="footer-ornament">
              <span>Photobooth</span>
              <span className="text-sage-300">&bull;</span>
              <span>Team's Uhuyyy Coperate</span>
              <span className="text-sage-300">&bull;</span>
              <span>2026</span>
            </div>
          </footer>
        </div>

        {activeModal && <Modal id={activeModal} onClose={() => setActiveModal(null)} />}
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
