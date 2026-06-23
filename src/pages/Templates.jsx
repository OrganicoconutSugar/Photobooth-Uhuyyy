import { useNavigate } from 'react-router-dom';
import FRAME_STYLES from '../lib/frameStyles';

const TEMPLATES = Object.values(FRAME_STYLES);

function TemplateCard({ template, onSelect }) {
  const isFun = template.id === 'cutie-cat' || template.id === 'retro-pop';

  return (
    <button
      onClick={() => onSelect(template.id)}
      className="group text-left bg-white rounded-2xl border border-sage-200 p-6 shadow-sage-md hover:shadow-sage-lg hover:border-sage-400 transition-all relative frame-sage"
    >
      <span className="ornament-lg-bl" />
      <span className="ornament-lg-br" />
      <div
        className="aspect-[3/4] rounded-xl mb-5 border overflow-hidden relative"
        style={{
          backgroundColor: template.bg,
          borderColor: template.border,
        }}
      >
        {isFun && (
          <div className="absolute inset-x-0 top-0 h-8 flex items-end justify-center gap-2 pb-1"
            style={{ backgroundColor: template.accent + '30' }}
          >
            <span className="text-[8px] font-bold tracking-widest uppercase"
              style={{ color: template.accent }}
            >
              {template.id === 'cutie-cat' ? '~ Meow ~' : '~ Pop! ~'}
            </span>
          </div>
        )}
        <div className="p-3 pt-9 space-y-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className="aspect-[4/3] rounded"
              style={{
                backgroundColor: template.accent + '25',
                border: '1px solid ' + template.border,
              }}
            />
          ))}
        </div>
        <div
          className="absolute bottom-0 inset-x-0 py-2 flex flex-col items-center justify-center border-t"
          style={{
            borderColor: template.border,
            backgroundColor: template.bg,
          }}
        >
          <span className="text-[8px] font-bold tracking-widest uppercase"
            style={{ color: template.accent }}
          >
            {template.watermark}
          </span>
        </div>
      </div>
      <div>
        <h3 className="font-semibold tracking-tight"
          style={{ color: template.text }}
        >
          {template.name}
        </h3>
        <p className="text-xs opacity-70 mt-0.5"
          style={{ color: template.text }}
        >
          {template.desc}
        </p>
      </div>
    </button>
  );
}

export default function Templates() {
  const navigate = useNavigate();

  const handleSelect = (id) => {
    navigate(`/kamera?template=${id}`);
  };

  return (
    <section className="w-full max-w-[1000px] mx-auto py-10 px-6">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-sage-800 ornament-heading">
          Pilih Template Frame
        </h1>
        <p className="text-sm text-sage-600 mt-2 max-w-md mx-auto">
          Setiap template memberikan tampilan border, warna, dan dekorasi yang berbeda pada strip foto kamu.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATES.map((t) => (
          <TemplateCard key={t.id} template={t} onSelect={handleSelect} />
        ))}
      </div>
    </section>
  );
}
