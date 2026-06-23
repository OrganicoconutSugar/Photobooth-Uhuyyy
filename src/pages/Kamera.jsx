import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { saveSession } from '../lib/galleryStore';
import { getFrameStyle } from '../lib/frameStyles';
import smileLogo from '../assets/icons/LogoSenyum.svg';
import manualLogo from '../assets/icons/LogoManual.svg';
import loadingKamera from '../assets/Kamera/LoadingKamera.jpg';

const SIMULATED_PHOTOS = [loadingKamera, loadingKamera, loadingKamera, loadingKamera];

const FILTER_STYLES = {
  none: 'none',
  'retro-bw': 'grayscale(100%) contrast(120%)',
  'warm-vintage': 'sepia(50%) hue-rotate(-10deg) saturate(110%)',
  'neon-vibe': 'hue-rotate(180deg) saturate(150%)',
};

// ── Smile detection dari face landmarks (pure function, no deps) ──
function detectSmile(landmarks) {
  const upperLip = landmarks[13];
  const lowerLip = landmarks[14];
  const noseTop = landmarks[10];
  const chin = landmarks[152];
  if (!upperLip || !lowerLip || !noseTop || !chin) return 0;
  const mouthH = Math.abs(upperLip.y - lowerLip.y);
  const faceH = Math.abs(noseTop.y - chin.y);
  if (faceH < 0.01) return 0;
  return mouthH / faceH;
}

function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-sage-800/95 backdrop-blur-md border border-sage-400/30 text-white px-8 py-4 rounded-full shadow-2xl text-xs font-semibold tracking-wide flex items-center gap-3">
      <svg className="w-4 h-4 text-sage-300 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

export default function Kamera() {
  const { user, loading } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const activeSlotRef = useRef(1);

  const [stream, setStream] = useState(null);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [filterType, setFilterType] = useState('none');
  const [activeSlot, setActiveSlot] = useState(1);
  const [capturedImages, setCapturedImages] = useState([null, null, null, null]);
  const [countdown, setCountdown] = useState(null);
  const [showFlash, setShowFlash] = useState(false);
  const [toast, setToast] = useState(null);

  const [searchParams] = useSearchParams();
  const frameTemplate = searchParams.get('template');
  const frameStyle = getFrameStyle(frameTemplate);
  const [sessionId, setSessionId] = useState(() => `PB-${Date.now().toString(36).toUpperCase()}`);
  const [saving, setSaving] = useState(false);
  const [captureMode, setCaptureMode] = useState('manual');
  const [mediapipeLoading, setMediapipeLoading] = useState(false);
  const [mediapipeReady, setMediapipeReady] = useState(false);
  const [mediapipeError, setMediapipeError] = useState(null);
  const [smileProgress, setSmileProgress] = useState(0);

  const faceMeshRef = useRef(null);
  const animFrameRef = useRef(null);
  const smileFrameCountRef = useRef(0);
  const triggerCountdownRef = useRef(null);
  const countdownRef = useRef(null);
  const captureModeRef = useRef('manual');

  // Sync refs biar selalu terbaru tanpa recreate FaceMesh
  useEffect(() => { countdownRef.current = countdown; }, [countdown]);
  useEffect(() => { captureModeRef.current = captureMode; }, [captureMode]);

  const showToast = useCallback((msg) => {
    setToast(msg);
  }, []);

  const streamRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const constraints = {
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        };
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) {
          newStream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = newStream;
        setStream(newStream);
        setCameraAvailable(true);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch {
        if (!cancelled) setCameraAvailable(false);
      }
    })();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // ── MediaPipe: load script dari CDN ──
  const loadFaceMesh = useCallback(async () => {
    if (window.FaceMesh) return true;
    setMediapipeLoading(true);
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => setTimeout(() => resolve(true), 200);
      script.onerror = () => { setMediapipeError('Gagal load MediaPipe'); resolve(false); };
      document.head.appendChild(script);
    });
  }, []);

  // ── MediaPipe: init FaceMesh ──
  const initFaceMesh = useCallback(async () => {
    const ok = await loadFaceMesh();
    if (!ok || !window.FaceMesh) return;
    try {
      const faceMesh = new window.FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        maxNumFaces: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((results) => {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
          setSmileProgress(0);
          smileFrameCountRef.current = 0;
          return;
        }

        const lm = results.multiFaceLandmarks[0];
        const ratio = detectSmile(lm);
        const progress = Math.min(100, Math.round(ratio * 500));

        setSmileProgress(progress);

        if (progress >= 50 && captureModeRef.current === 'smile' && countdownRef.current === null && activeSlotRef.current <= 4) {
          smileFrameCountRef.current++;
          if (smileFrameCountRef.current >= 6) {
            smileFrameCountRef.current = 0;
            if (triggerCountdownRef.current) triggerCountdownRef.current();
          }
        } else {
          smileFrameCountRef.current = 0;
        }
      });

      faceMeshRef.current = faceMesh;
      setMediapipeReady(true);
      setMediapipeLoading(false);
    } catch {
      setMediapipeError('Gagal init FaceMesh');
      setMediapipeLoading(false);
    }
  }, [loadFaceMesh]);

  // ── MediaPipe: init ketika kamera hidup ──
  useEffect(() => {
    if (!cameraAvailable) return;
    Promise.resolve().then(() => initFaceMesh());
    return () => {
      if (faceMeshRef.current) {
        try { faceMeshRef.current.close(); } catch { /* ignore */ }
        faceMeshRef.current = null;
      }
      setMediapipeReady(false);
    };
  }, [cameraAvailable, initFaceMesh]);

  // ── Frame processing loop ──
  useEffect(() => {
    if (!cameraAvailable || !mediapipeReady || !faceMeshRef.current || !videoRef.current) return;

    let running = true;
    async function processFrame() {
      if (!running) return;
      if (videoRef.current && faceMeshRef.current) {
        try { await faceMeshRef.current.send({ image: videoRef.current }); } catch { /* ignore */ }
      }
      animFrameRef.current = requestAnimationFrame(processFrame);
    }
    processFrame();

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [cameraAvailable, mediapipeReady]);

  const applyCanvasFilters = (ctx, canvas, filter) => {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    if (filter === 'retro-bw') {
      for (let i = 0; i < data.length; i += 4) {
        const brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
        const finalB = 1.2 * (brightness - 128) + 128;
        data[i] = finalB;
        data[i + 1] = finalB;
        data[i + 2] = finalB;
      }
    } else if (filter === 'warm-vintage') {
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        data[i] = r * 0.393 + g * 0.769 + b * 0.189;
        data[i + 1] = r * 0.349 + g * 0.686 + b * 0.168;
        data[i + 2] = r * 0.272 + g * 0.534 + b * 0.131;
      }
    } else if (filter === 'neon-vibe') {
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        data[i] = data[i + 2] * 1.2;
        data[i + 2] = r * 1.1;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  const saveFrame = (dataUrl) => {
    const slot = activeSlotRef.current;
    setCapturedImages((prev) => {
      const next = [...prev];
      next[slot - 1] = dataUrl;
      return next;
    });
    if (slot < 4) {
      const nextSlot = slot + 1;
      activeSlotRef.current = nextSlot;
      setActiveSlot(nextSlot);
    } else {
      setActiveSlot(5);
    }
  };

  const executeCapture = useCallback(() => {
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 500);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 480;

    if (cameraAvailable && stream && video) {
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      applyCanvasFilters(ctx, canvas, filterType);
      saveFrame(canvas.toDataURL());
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        applyCanvasFilters(ctx, canvas, filterType);
        saveFrame(canvas.toDataURL());
      };
      img.src = SIMULATED_PHOTOS[activeSlotRef.current - 1];
    }
  }, [cameraAvailable, stream, filterType]);

  const triggerCountdown = useCallback(() => {
    if (activeSlotRef.current > 4) {
      showToast('Cetakan foto sudah penuh! Silakan bersihkan strip atau ulang kembali.');
      return;
    }

    let count = 3;
    setCountdown(count);

    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(timer);
        setCountdown(null);
        executeCapture();
      }
    }, 1000);
  }, [executeCapture, showToast]);

  // Sync ref untuk akses dari initFaceMesh
  useEffect(() => { triggerCountdownRef.current = triggerCountdown; }, [triggerCountdown]);

  const generateAndDownloadStrip = async () => {
    const images = capturedImages;
    if (images.some((img) => img === null)) {
      showToast('Silakan lengkapi seluruh 4 jepretan foto sebelum mengunduh.');
      return;
    }

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

    // Background sesuai template
    ctx.fillStyle = frameStyle.bg;
    ctx.fillRect(0, 0, stripWidth, stripHeight);

    // Header decoration untuk template fun
    if (frameStyle.id === 'cutie-cat' || frameStyle.id === 'retro-pop') {
      ctx.fillStyle = frameStyle.border + '60';
      ctx.fillRect(0, 0, stripWidth, 32);
      ctx.fillStyle = frameStyle.accent;
      ctx.textAlign = 'center';
      ctx.font = 'bold 10px "Poppins", sans-serif';
      ctx.fillText(frameStyle.id === 'cutie-cat' ? '~ Meow ~' : '~ Pop! ~', stripWidth / 2, 21);
    }

    let currentY = padding;
    const yPositions = [];

    for (let i = 0; i < 4; i++) {
      yPositions.push(currentY);
      currentY += ph + gap;
    }

    await Promise.all(images.map((src, i) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const yPos = yPositions[i];

        // Shadow untuk efek polaroid
        if (frameStyle.id === 'polaroid') {
          ctx.shadowColor = 'rgba(0,0,0,0.08)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetY = 4;
        }

        ctx.strokeStyle = frameStyle.border;
        ctx.lineWidth = 1;
        ctx.strokeRect(padding, yPos, pw, ph);
        ctx.drawImage(img, padding, yPos, pw, ph);

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        resolve();
      };
      img.src = src;
    })));

    // Watermark area
    const watermarkY = yPositions[3] + ph + gap;
    ctx.strokeStyle = frameStyle.accent;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding * 2, watermarkY + 15);
    ctx.lineTo(stripWidth - padding * 2, watermarkY + 15);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = frameStyle.text;
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px "Poppins", sans-serif';
    ctx.fillText(frameStyle.watermark, stripWidth / 2, watermarkY + 45);
    ctx.fillStyle = frameStyle.accent;
    ctx.font = 'normal 11px "Poppins", sans-serif';
    ctx.fillText('Est 2025 \u2022 Free Web Photo', stripWidth / 2, watermarkY + 65);

    const link = document.createElement('a');
    link.download = `photobooth-${frameStyle.id}.png`;
    link.href = c.toDataURL('image/png');
    link.click();

    // Save to localStorage fallback
    saveSession({
      id: sessionId,
      images: [...capturedImages],
      createdAt: Date.now(),
      frame_template: frameTemplate,
    });
  };

  const handleSaveToGallery = async () => {
    const images = capturedImages;
    if (images.some((img) => img === null)) {
      showToast('Lengkapi seluruh 4 jepretan foto dulu ya.');
      return;
    }

    const token = localStorage.getItem('pb_token');
    if (!token) {
      showToast('Login dulu ya biar foto tersimpan di Gallery!');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          images: [...capturedImages],
          frame_template: frameTemplate,
        }),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = {}; }
      if (res.ok) {
        showToast('Foto tersimpan ke gallery!');
      } else {
        showToast(data.error || `Gagal menyimpan (${res.status})`);
      }
    } catch {
      showToast('Gagal menyimpan — cek koneksi server');
    } finally {
      setSaving(false);
    }
  };

  const resetPhotobooth = () => {
    activeSlotRef.current = 1;
    setActiveSlot(1);
    setCapturedImages([null, null, null, null]);
    setSessionId(`PB-${Date.now().toString(36).toUpperCase()}`);
  };

  const videoFilter = FILTER_STYLES[filterType] || 'none';

  if (loading) return null;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;

  return (
    <section className="w-full max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start py-4 relative">
      <div className="lg:col-span-8 flex flex-col items-center gap-6">
        <div className="w-full bg-white rounded-3xl p-6 shadow-sage-xl border border-sage-200/80 relative frame-sage">
          <span className="ornament-lg-bl" />
          <span className="ornament-lg-br" />
          <div className="relative aspect-[4/3] w-full sage-gradient rounded-2xl overflow-hidden shadow-inner flex items-center justify-center ornament-border">
            <span className="ornament-border-bl" />
            <span className="ornament-border-br" />
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover -scale-x-100 transition-all ${cameraAvailable ? 'block' : 'hidden'}`}
              style={{ filter: videoFilter }}
            />

            {!cameraAvailable && (
              <div className="absolute inset-0 bg-sage-800 flex flex-col items-center justify-center text-center p-6 transition-opacity duration-300">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm mix-blend-luminosity saturate-50"
                  style={{
                    backgroundImage: `url('${SIMULATED_PHOTOS[0]}')`,
                    filter: videoFilter,
                  }}
                />
                <div className="relative z-10 space-y-4 max-w-sm">
                  <img src={manualLogo} alt="Manual" className="w-16 h-16 mx-auto" />
                  <h3 className="text-white font-semibold tracking-tight text-lg">Kamera Simulasi Aktif</h3>
                  <p className="text-xs text-white/60">
                    Kami merekomendasikan mengizinkan akses webcam browser untuk menikmati pengalaman penuh. Klik izinkan di pojok kiri atas browser.
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        const constraints = {
                          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
                          audio: false,
                        };
                        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
                        streamRef.current = newStream;
                        setStream(newStream);
                        setCameraAvailable(true);
                        if (videoRef.current) {
                          videoRef.current.srcObject = newStream;
                        }
                      } catch {
                        setCameraAvailable(false);
                      }
                    }}
                    className="mx-auto bg-sage-500 hover:bg-sage-600 text-white px-5 py-2.5 rounded-full font-semibold text-xs transition-all flex items-center gap-1.5 shadow-md"
                  >
                    Aktifkan Kamera Asli
                  </button>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            {/* Level 3: Camera frame overlay */}
            {cameraAvailable && (
              <div
                className="absolute inset-0 z-10 pointer-events-none rounded-2xl"
                style={{
                  boxShadow: `inset 0 0 0 6px ${frameStyle.border}, inset 0 0 0 10px ${frameStyle.accent}25`,
                }}
              />
            )}

            {countdown !== null && (
              <div className="absolute inset-0 bg-sage-800/50 z-30 flex items-center justify-center">
                <span className="text-sage-200 text-8xl md:text-9xl font-bold font-mono tracking-tighter select-none">
                  {countdown}
                </span>
              </div>
            )}

            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sage-500 animate-pulse" />
              <span className="text-white font-mono text-xs uppercase tracking-wider bg-sage-800/50 backdrop-blur-md px-2 py-0.5 rounded">
                LIVE
              </span>
            </div>

            <div className="absolute bottom-4 left-4 z-20 bg-sage-800/50 backdrop-blur-md px-3 py-1 rounded text-white/90 text-xs font-mono">
              Slot Aktif: <span>{activeSlot}</span> / 4
            </div>

            {/* MediaPipe loading */}
            {mediapipeLoading && cameraAvailable && (
              <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-sage-800/60 backdrop-blur-md px-3 py-1.5 rounded-full">
                <svg className="w-3.5 h-3.5 text-sage-300 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                </svg>
                <span className="text-white/80 text-[10px] font-mono">Face Mesh...</span>
              </div>
            )}

            {/* MediaPipe error */}
            {mediapipeError && (
              <div className="absolute bottom-4 right-4 z-20 bg-red-800/60 backdrop-blur-md px-3 py-1.5 rounded-full">
                <span className="text-white/80 text-[10px] font-mono">{mediapipeError}</span>
              </div>
            )}

            {/* Smile progress bar */}
            {captureMode === 'smile' && cameraAvailable && mediapipeReady && (
              <div className="absolute bottom-14 left-4 right-4 z-20 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-sage-800/40 rounded-full overflow-hidden backdrop-blur-sm">
                  <div
                    className="h-full rounded-full transition-all duration-150"
                    style={{
                      width: `${Math.min(100, smileProgress)}%`,
                      backgroundColor: smileProgress >= 50 ? '#9CAF88' : '#C5D0B8',
                    }}
                  />
                </div>
                <span className="text-white/80 text-[10px] font-mono w-8 text-right">
                  {Math.min(100, smileProgress)}%
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-sage-200">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-sage-600 font-mono uppercase tracking-wider">Filter Gaya</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-sage-100 hover:bg-sage-200 border border-sage-300 text-xs rounded-full px-4 py-1.5 text-sage-800 font-semibold outline-none transition-colors"
                >
                  <option value="none">Normal (Warna)</option>
                  <option value="retro-bw">Retro (Hitam Putih)</option>
                  <option value="warm-vintage">Vintage (Hangat)</option>
                  <option value="neon-vibe">Cyberpunk (Neon)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-sage-600 font-mono uppercase tracking-wider">Mode Capture</label>
                <div className="flex bg-sage-100 rounded-full p-0.5 border border-sage-200">
                  <button
                    onClick={() => setCaptureMode('manual')}
                    className={`text-xs px-3 py-1 rounded-full font-semibold transition-all ${captureMode === 'manual' ? 'bg-white text-sage-800 shadow-sm' : 'text-sage-500 hover:text-sage-700'}`}
                  >
                    Manual
                  </button>
                  <button
                    onClick={() => setCaptureMode('smile')}
                    className={`text-xs px-3 py-1 rounded-full font-semibold transition-all inline-flex items-center gap-1 ${captureMode === 'smile' ? 'bg-white text-sage-800 shadow-sm' : 'text-sage-500 hover:text-sage-700'}`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                    </svg>
                    Senyum
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={resetPhotobooth}
              className="p-2 text-sage-600 hover:text-sage-800 hover:bg-sage-200 rounded-full transition-all text-xs flex items-center gap-1.5"
              title="Hapus Semua & Ulangi"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.656 48.656 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
              </svg>
              <span className="hidden sm:inline">Ulang Dari Awal</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            id="captureButton"
            onClick={triggerCountdown}
            disabled={countdown !== null}
            className="hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <img src={captureMode === 'smile' ? smileLogo : manualLogo} alt="Photobooth" className="w-20 h-20" />
          </button>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sage-800">
              {captureMode === 'smile' ? 'Senyum untuk memicu jepretan!' : 'Tekan untuk menjepret foto!'}
            </span>
            <span className="text-xs text-sage-600">
              {captureMode === 'smile' ? 'Mode Senyum aktif — 3 detik setelah senyum terdeteksi' : 'Proses berhitung mundur otomatis 3 detik'}
            </span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col items-center lg:items-start gap-4 w-full">
        <h2 className="text-md font-bold tracking-tight text-sage-700 pl-1">
          Pratinjau Hasil Cetak
        </h2>

        <div className="w-full bg-white rounded-3xl p-8 shadow-sage-lg border border-sage-200/80 flex flex-col items-center justify-center relative frame-sage">
          <span className="ornament-lg-bl" />
          <span className="ornament-lg-br" />
          <div
            className="p-4 pb-8 shadow-lg rounded-md w-56 space-y-3 relative select-none"
            style={{
              backgroundColor: frameStyle.bg,
              borderColor: frameStyle.border,
              borderWidth: '1px',
            }}
          >
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map((slot) => (
                <div
                  key={slot}
                  className="relative aspect-[4/3] rounded overflow-hidden flex items-center justify-center"
                  style={{
                    backgroundColor: frameStyle.accent + '20',
                    border: '1px solid ' + frameStyle.border,
                  }}
                >
                  {capturedImages[slot - 1] ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url('${capturedImages[slot - 1]}')` }}
                    />
                  ) : (
                    <span
                      className="font-mono text-sm"
                      style={{ color: frameStyle.accent + '80' }}
                    >
                      Slot {slot}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div
              className="pt-4 flex flex-col items-center justify-center border-t border-dashed"
              style={{ borderColor: frameStyle.border }}
            >
              <span
                className="text-[9px] font-mono tracking-widest font-bold"
                style={{ color: frameStyle.accent }}
              >
                {frameStyle.watermark}
              </span>
              <span
                className="text-[7px] font-mono tracking-widest uppercase"
                style={{ color: frameStyle.accent + '90' }}
              >
                Est 2025 &bull; Free Web
              </span>
            </div>
          </div>

          <div className="mt-6 w-full space-y-2">
            <button
              onClick={generateAndDownloadStrip}
              disabled={capturedImages.some((img) => img === null)}
              className="w-full bg-sage-500 disabled:bg-sage-200 disabled:text-sage-400 disabled:shadow-none text-white font-semibold rounded-full py-3.5 text-sm shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Unduh Cetakan Foto (.png)
            </button>
            <button
              onClick={handleSaveToGallery}
              disabled={capturedImages.some((img) => img === null) || saving}
              className="w-full bg-white border-2 border-sage-300 disabled:border-sage-200 disabled:text-sage-300 disabled:cursor-not-allowed text-sage-600 font-semibold rounded-full py-3 text-xs shadow-sm hover:bg-sage-50 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                  Menyimpan...
                </span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                  Simpan ke Gallery
                </>
              )}
            </button>
            <p className="text-[10px] text-sage-500 text-center">Selesaikan seluruh 4 foto untuk menyimpan ke gallery.</p>
          </div>
        </div>
      </div>

      {showFlash && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-white/70 animate-fade-in" />
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </section>
  );
}
