import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AccountMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  if (!user) {
    return (
      <Link
        to="/login"
        className="w-8 h-8 rounded-full bg-sage-200 flex items-center justify-center text-sage-600 hover:bg-sage-300 transition-all shrink-0"
        title="Login"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs hover:bg-sage-600 transition-all shrink-0 relative overflow-hidden ${
          user.role === 'admin' ? 'bg-sage-700 ring-2 ring-sage-400/50' : 'bg-sage-500'
        }`}
        title={user.username}
      >
        {user.avatar ? (
          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          user.username.charAt(0).toUpperCase()
        )}
        {user.role === 'admin' && (
          <svg className="absolute -top-1 -right-1 w-3.5 h-3.5 text-sage-600" viewBox="0 0 14 14" fill="currentColor">
            <path d="M7 0C8.5 2 11 3 13 3V7C13 10.5 10 13 7 14C4 13 1 10.5 1 7V3C3 3 5.5 2 7 0Z" />
          </svg>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-20 w-56 glass-sage rounded-2xl border border-sage-200/40 shadow-lg py-2">
            <div className="px-5 py-3 border-b border-sage-200/30">
              <p className="text-sm font-semibold text-sage-800">{user.username}</p>
              <p className="text-xs text-sage-500 truncate">{user.email}</p>
              {user.role === 'admin' && (
                <span className="inline-block mt-1.5 text-[10px] uppercase tracking-widest bg-sage-500/15 text-sage-600 px-2.5 py-0.5 rounded-full font-semibold">
                  Admin
                </span>
              )}
            </div>
            <Link
              to="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-5 py-2.5 text-sm text-sage-700 hover:bg-sage-100/50 transition-colors"
            >
              <svg className="w-4 h-4 text-sage-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profil Saya
            </Link>
            {user.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-5 py-2.5 text-sm text-sage-700 hover:bg-sage-100/50 transition-colors"
              >
                <svg className="w-4 h-4 text-sage-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin Panel
              </Link>
            )}
            <div className="border-t border-sage-200/30 mt-1 pt-1">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-5 py-2.5 text-sm text-red-500 hover:bg-red-50/50 transition-colors w-full text-left"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Keluar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
