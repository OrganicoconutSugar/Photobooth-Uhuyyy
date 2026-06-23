import { useCallback, useEffect, useState } from 'react';

export default function Lightbox({ images, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const current = images[index];

  const goNext = useCallback(() => {
    if (index < images.length - 1) setIndex(index + 1);
  }, [index, images.length]);

  const goPrev = useCallback(() => {
    if (index > 0) setIndex(index - 1);
  }, [index]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
  }, [onClose, goNext, goPrev]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const downloadImage = () => {
    const link = document.createElement('a');
    link.download = `photobooth-foto-${index + 1}.png`;
    link.href = current;
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-sage-800/80 backdrop-blur-md flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image */}
        <div className="relative flex items-center gap-4">
          {index > 0 && (
            <button
              onClick={goPrev}
              className="absolute -left-14 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-2 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <img
            src={current}
            alt={`Foto ${index + 1}`}
            className="max-w-full max-h-[75vh] rounded-2xl shadow-2xl border-2 border-white/10 object-contain"
          />

          {index < images.length - 1 && (
            <button
              onClick={goNext}
              className="absolute -right-14 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-2 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Dots */}
        <div className="mt-5 flex items-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'bg-sage-400 w-6' : 'bg-white/30 hover:bg-white/50 w-2'
              }`}
            />
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-4 flex items-center gap-4">
          <span className="text-sm text-white/60 font-mono">
            {index + 1} / {images.length}
          </span>

          <div className="w-px h-4 bg-white/20" />

          <button
            onClick={downloadImage}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-full px-5 py-2 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download Foto
          </button>
        </div>
      </div>
    </div>
  );
}
