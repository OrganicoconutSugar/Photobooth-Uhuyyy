import { useState } from 'react';
import { Link } from 'react-router-dom';

const PHOTO_GLOB = import.meta.glob('../assets/strip/*.{svg,jpg,jpeg,png,webp}', { eager: true });
const STRIP_PHOTOS = Object.values(PHOTO_GLOB).map((m) => m.default);

const RIGHT_GLOB = import.meta.glob('../assets/strip/About?.jpeg', { eager: true });
const RIGHT_FILES = Object.values(RIGHT_GLOB).map((m) => m.default).sort();
const STRIP_RIGHT_PHOTOS = RIGHT_FILES.slice(0, 4);

function DecorativeLeaf({ className }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 2 C28 8 32 18 28 28 C24 38 14 38 8 32 C4 28 4 20 8 14 C12 8 16 4 20 2Z" />
      <path d="M20 12 C22 16 22 20 20 24" />
    </svg>
  );
}

function HeroStrip({ rotate = '-6', photos = STRIP_PHOTOS }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="bg-white p-2 pb-6 rounded-xl shadow-lg shadow-sage-500/10 border border-sage-200 transition-all duration-500 w-40"
      style={{ transform: hovered ? 'rotate(0deg) scale(1.05)' : `rotate(${rotate}deg)` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="space-y-1.5">
        {photos.slice(0, 4).map((url, i) => (
          <div
            key={i}
            className="w-full aspect-[4/3] rounded-lg bg-cover bg-center"
            style={{ backgroundImage: `url('${url}')` }}
          />
        ))}
      </div>
      <div className="mt-3 text-center">
        <span className="text-[8px] text-sage-400 uppercase tracking-[0.25em] font-mono">Photobooth</span>
      </div>
    </div>
  );
}

export default function Beranda() {
  return (
    <section className="w-full max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-8 md:py-12 relative">
      {/* decorative background flourish */}
      <div className="hidden lg:block absolute -top-16 -left-16 w-48 h-48 rounded-full bg-sage-200/20 blur-3xl pointer-events-none" />
      <div className="hidden lg:block absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-sage-300/15 blur-3xl pointer-events-none" />

      <div className="hidden lg:flex lg:col-span-3 justify-start -ml-8 relative">
        <div className="relative">
          <DecorativeLeaf className="absolute -top-8 -left-8 w-12 h-12 text-sage-300 animate-float" />
          <div className="ornament-lg relative inline-block p-1 rounded-xl">
            <span className="ornament-lg-bl" />
            <span className="ornament-lg-br" />
            <HeroStrip rotate="-6" />
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-sage-200/40 blur-xl" />
        </div>
      </div>

      <div className="lg:col-span-6 flex flex-col items-center text-center space-y-8">
        <div className="glass-sage rounded-full px-6 py-2 border border-sage-200/40 animate-fade-in">
          <span className="text-[10px] uppercase tracking-widest text-sage-600 font-semibold">
            &mdash; Teams Uhuyyy Coperate &mdash;
          </span>
        </div>

        <div className="relative inline-block">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-sage-800 leading-[0.85] ornament-heading">
            Photobooth
          </h1>
          <p className="text-lg md:text-xl text-sage-600/90 max-w-[500px] leading-relaxed font-light">
            Abadikan momen indah dalam strip foto estetik. Pilih template, jepret 4 foto, dan unduh cetakan klasik digital.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-4">
          <Link
            to="/kamera"
            className="group relative px-8 py-4 bg-sage-500 text-white font-semibold rounded-full shadow-[0_8px_24px_rgba(156,175,136,0.3)] hover:shadow-[0_12px_32px_rgba(156,175,136,0.45)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3"
          >
            <span className="relative z-10 tracking-wide text-base">Mulai Berfoto</span>
            <svg className="w-4 h-4 relative z-10 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            to="/templates"
            className="px-6 py-4 border-2 border-sage-300 text-sage-600 font-semibold rounded-full hover:bg-sage-100/50 transition-all text-sm"
          >
            Lihat Template
          </Link>
        </div>

        <div className="flex items-center gap-6 text-xs text-sage-500 font-mono pt-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sage-500 animate-pulse" />
            4 Foto Per Strip
          </span>
          <span>&#8226;</span>
          <span>6 Template Frame</span>
          <span>&#8226;</span>
          <span>Cetak Gratis</span>
        </div>
      </div>

      <div className="hidden lg:flex lg:col-span-3 justify-end -mr-8 relative">
        <div className="relative">
          <DecorativeLeaf className="absolute -bottom-8 -right-8 w-12 h-12 text-sage-300 animate-float rotate-180" />
          <div className="ornament-lg relative inline-block p-1 rounded-xl">
            <span className="ornament-lg-bl" />
            <span className="ornament-lg-br" />
            <HeroStrip rotate="6" photos={STRIP_RIGHT_PHOTOS} />
          </div>
          <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-sage-200/40 blur-xl" />
        </div>
      </div>
    </section>
  );
}
