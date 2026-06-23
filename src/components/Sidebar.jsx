import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccountMenu from './AccountMenu';
import homeIcon from '../assets/icons/home.svg';
import cameraIcon from '../assets/icons/camera.svg';
import galleryIcon from '../assets/icons/gallery.svg';
import templatesIcon from '../assets/icons/templates.svg';
import logoCamera from '../assets/icons/LogoCamera.svg';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: homeIcon },
  { to: '/kamera', label: 'Kamera', admin: false, icon: cameraIcon },
  { to: '/gallery', label: 'Gallery', icon: galleryIcon },
  { to: '/templates', label: 'Templates', icon: templatesIcon },
];

export default function NavBar({ onOpenModal }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const items = NAV_ITEMS.filter(item => item.admin !== false || user?.role !== 'admin');

  return (
    <header className="w-full px-6 pt-6 pb-3 z-20 relative">
      <nav className="max-w-[1200px] mx-auto glass-sage rounded-2xl md:rounded-full px-8 py-4 flex items-center justify-between gap-4 border border-sage-200/30 shadow-sage-md relative">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity shrink-0 relative">
          <img src={logoCamera} alt="Photobooth" className="w-8 h-8 relative" />
          <span className="font-semibold text-lg tracking-tight text-sage-800">Photobooth</span>
        </Link>

        <div className="hidden md:flex items-center gap-1.5 text-sm font-medium">
          {items.map((item) => {
            const isActive = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-4 py-1.5 rounded-full transition-all inline-flex items-center gap-2 ${isActive
                  ? 'bg-sage-500/15 text-sage-600 font-semibold'
                  : 'text-sage-700/80 hover:text-sage-600 hover:bg-sage-500/10'
                  }`}
              >
                <img src={item.icon} alt="" className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <button
              onClick={() => onOpenModal?.('about')}
              className="text-xs text-sage-400 hover:text-sage-600 transition-colors px-3 py-1 font-medium"
            >
              Tentang
            </button>
            <span className="text-sage-200">/</span>
            <button
              onClick={() => onOpenModal?.('privacy')}
              className="text-xs text-sage-400 hover:text-sage-600 transition-colors px-3 py-1 font-medium"
            >
              Privasi
            </button>
          </div>

          <button
            className="md:hidden p-2 text-sage-600 hover:bg-sage-100 rounded-full transition-all"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <AccountMenu />
        </div>
      </nav>

      {menuOpen && (
        <div className="md:hidden max-w-[1200px] mx-auto mt-2 glass-sage rounded-2xl px-5 py-4 border border-sage-200/30 shadow-sm">
          <div className="flex flex-col gap-1.5 text-sm">
            {items.map((item) => {
              const isActive = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg transition-all inline-flex items-center gap-2.5 ${isActive ? 'bg-sage-500/15 text-sage-600 font-semibold' : 'text-sage-700/80 hover:bg-sage-100'
                    }`}
                >
                  <img src={item.icon} alt="" className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            <hr className="border-sage-200/50 my-2" />
            <button onClick={() => { setMenuOpen(false); onOpenModal?.('about'); }} className="px-3 py-2.5 text-sage-500 hover:bg-sage-100 rounded-lg text-left">
              Tentang
            </button>
            <button onClick={() => { setMenuOpen(false); onOpenModal?.('privacy'); }} className="px-3 py-2.5 text-sage-500 hover:bg-sage-100 rounded-lg text-left">
              Privasi
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
