import { useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function compressImage(file, maxSize = 100) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        const s = Math.min(maxSize / img.width, maxSize / img.height, 1);
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function Account() {
  const { user, loading, updateProfile, logout } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updates = { username, bio };
      if (avatarFile) {
        updates.avatar = await compressImage(avatarFile);
        setAvatar(updates.avatar);
        setAvatarPreview(null);
        setAvatarFile(null);
      }
      await updateProfile(updates);
      setMessage('Profil berhasil diperbarui');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const displayAvatar = avatarPreview || avatar || user?.avatar;

  return (
    <section className="w-full max-w-[600px] mx-auto py-10 px-6">
      <div className="flex flex-col items-center mb-10">
        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden hover:opacity-90 transition-all ring-2 ring-sage-200 ring-offset-2 ring-offset-sage-50"
            style={{
              backgroundColor: displayAvatar ? 'transparent' : '#9CAF88',
            }}
            title="Klik untuk ganti foto"
          >
            {displayAvatar ? (
              <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user.username.charAt(0).toUpperCase()
            )}
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border-2 border-sage-200 flex items-center justify-center text-sage-600 hover:bg-sage-50 transition-all shadow-sm"
            title="Ganti foto profile"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0110 3h4a2.31 2.31 0 013.173 3.175 2.31 2.31 0 00-.291 1.054V9a2.25 2.25 0 01-2.25 2.25h-5.25A2.25 2.25 0 014.5 9V7.229c0-.422-.104-.837-.29-1.054z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11.25a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-sage-800 mt-4">Profil Saya</h1>
        <p className="text-sm text-sage-600">{user.email}</p>
        {user.role === 'admin' && (
          <span className="inline-block mt-1.5 text-[10px] uppercase tracking-wider bg-sage-500/10 text-sage-600 px-3 py-1 rounded-full font-semibold">
            Admin
          </span>
        )}
      </div>

      <div className="ornament-border frame-sage rounded-2xl p-10 bg-white/60 relative">
        <div className="ornament-border-bl" />
        <div className="ornament-border-br" />

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-xs text-sage-600 font-semibold mb-2 tracking-wide">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-sage-50 border border-sage-200 text-sage-800 text-sm placeholder:text-sage-400 focus:outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500/30 transition-all"
              placeholder="Username"
            />
          </div>

          <div>
            <label className="block text-xs text-sage-600 font-semibold mb-2 tracking-wide">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2.5 rounded-xl bg-sage-100 border border-sage-200 text-sage-500 text-sm cursor-not-allowed"
            />
            <p className="text-[10px] text-sage-400 mt-1">Email tidak dapat diubah</p>
          </div>

          <div>
            <label className="block text-xs text-sage-600 font-semibold mb-2 tracking-wide">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-sage-50 border border-sage-200 text-sage-800 text-sm placeholder:text-sage-400 focus:outline-none focus:border-sage-500 focus:ring-1 focus:ring-sage-500/30 transition-all resize-none"
              placeholder="Ceritakan tentang dirimu..."
            />
          </div>

          {message && (
            <div className="text-xs text-sage-600 bg-sage-100 rounded-xl px-5 py-2.5">
              {message}
            </div>
          )}

          {error && (
            <div className="text-xs text-red-500 bg-red-50 rounded-xl px-5 py-2.5">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-sage-500 hover:bg-sage-600 disabled:bg-sage-300 text-white rounded-full text-sm font-semibold tracking-wide transition-all"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            <button
              type="button"
              onClick={logout}
              className="py-2.5 px-6 border border-red-200 text-red-500 hover:bg-red-50 rounded-full text-sm font-semibold tracking-wide transition-all"
            >
              Keluar
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
