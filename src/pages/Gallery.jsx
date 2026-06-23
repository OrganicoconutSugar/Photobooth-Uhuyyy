import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { loadSessions } from '../lib/galleryStore';
import Lightbox from '../components/Lightbox';

function regenerateStrip(images) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const stripWidth = 400;
  const stripHeight = 1200;
  const padding = 20;
  const gap = 15;
  const pw = stripWidth - padding * 2;
  const ph = pw * 0.75;

  c.width = stripWidth;
  c.height = stripHeight;

  ctx.fillStyle = '#F8F9F6';
  ctx.fillRect(0, 0, stripWidth, stripHeight);

  let loaded = 0;
  let currentY = padding;

  return new Promise((resolve) => {
    for (let i = 0; i < 4; i++) {
      const img = new Image();
      const yPos = currentY;
      img.onload = () => {
        ctx.strokeStyle = '#C5D0B8';
        ctx.lineWidth = 1;
        ctx.strokeRect(padding, yPos, pw, ph);
        ctx.drawImage(img, padding, yPos, pw, ph);
        loaded++;
        if (loaded === 4) {
          const watermarkY = yPos + ph + gap;
          ctx.strokeStyle = '#9CAF88';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(padding * 2, watermarkY + 15);
          ctx.lineTo(stripWidth - padding * 2, watermarkY + 15);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#5A6E4A';
          ctx.textAlign = 'center';
          ctx.font = 'bold 16px "Poppins", sans-serif';
          ctx.fillText('Photobooth.', stripWidth / 2, watermarkY + 45);
          ctx.fillStyle = '#7A9068';
          ctx.font = 'normal 11px "Poppins", sans-serif';
          ctx.fillText('Est 2025 \u2022 Free Web Photo', stripWidth / 2, watermarkY + 65);

          resolve(c.toDataURL('image/png'));
        }
      };
      img.src = images[i];
      currentY += ph + gap;
    }
  });
}

export default function Gallery() {
  const { user, loading: authLoading, token } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      Promise.resolve().then(() => {
        setSessions(loadSessions());
        setLoading(false);
      });
      return;
    }
    (async () => {
      try {
        const res = await fetch('/api/sessions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.sessions) {
          setSessions(data.sessions);
        } else {
          setSessions(loadSessions());
        }
      } catch {
        setSessions(loadSessions());
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, token]);

  const refreshSessions = async () => {
    if (!token) return;
    const res = await fetch('/api/sessions', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.sessions) setSessions(data.sessions);
  };

  const handleDelete = async (id) => {
    if (!token) return;
    await fetch(`/api/sessions/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    refreshSessions();
  };

  const handleDownloadStrip = async (session) => {
    const dataUrl = await regenerateStrip(session.images);
    const link = document.createElement('a');
    link.download = `photobooth-strip-${session.id.slice(0, 8)}.png`;
    link.href = dataUrl;
    link.click();
  };

  if (authLoading || loading) return null;

  if (!user) {
    return (
      <section className="w-full max-w-[600px] mx-auto py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center text-sage-400 mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-sage-800 mb-3">Login untuk Lihat Gallery</h2>
        <p className="text-sm text-sage-600 mb-6">Masuk ke akun kamu untuk melihat strip foto yang tersimpan.</p>
        <Link to="/login" className="inline-block px-6 py-2.5 bg-sage-500 text-white rounded-full text-sm font-semibold transition-all hover:bg-sage-600">
          Login Sekarang
        </Link>
      </section>
    );
  }

  return (
    <section className="w-full max-w-[1000px] mx-auto py-8 px-6 relative">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-sage-800 ornament-heading">Galeri Strip Foto</h2>
          <p className="text-xs text-sage-600 mt-3">{sessions.length} Tersimpan</p>
        </div>
      </div>

      {sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center text-sage-400 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0110 3h4a2.31 2.31 0 013.173 3.175 2.31 2.31 0 00-.291 1.054V9a2.25 2.25 0 01-2.25 2.25h-5.25A2.25 2.25 0 014.5 9V7.229c0-.422-.104-.837-.29-1.054z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-sage-700 mb-1">Belum Ada Cetakan</h3>
          <p className="text-xs text-sage-500 max-w-xs">Ambil foto dan unduh strip cetakanmu, nanti akan muncul di sini.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="bg-white rounded-2xl p-5 shadow-sage-md border border-sage-200 hover:shadow-sage-lg transition-all relative frame-sage"
          >
            <span className="ornament-lg-bl" />
            <span className="ornament-lg-br" />
            <div className="flex gap-2 mb-4">
              {session.images.slice(0, 4).map((url, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox({ session, photoIndex: i })}
                  className="flex-1 aspect-[3/4] rounded-lg bg-cover bg-center border border-sage-100 hover:border-sage-500 transition-all hover:scale-[1.03]"
                  style={{ backgroundImage: `url('${url}')` }}
                />
              ))}
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-sage-400 uppercase tracking-wider font-mono">
                  {session.frame_template}
                </span>
                <span className="text-[10px] text-sage-300">&bull;</span>
                <span className="text-[10px] text-sage-400 font-mono">
                  {new Date(session.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadStrip(session)}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-sage-500 hover:bg-sage-600 text-white font-semibold rounded-full py-2 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Unduh Strip
              </button>
              <button
                onClick={() => handleDelete(session.id)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                title="Hapus Session"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {lightbox && (
        <Lightbox
          images={lightbox.session.images}
          initialIndex={lightbox.photoIndex}
          onClose={() => setLightbox(null)}
        />
      )}
    </section>
  );
}
