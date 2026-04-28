import type { Prestation } from '../types';

interface ServiceListProps {
  prestations: Prestation[];
  onBook?: (prestation: Prestation) => void;
  selectable?: boolean;
  selectedId?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Tresses: 'bg-purple-100 text-purple-700',
  Coupe: 'bg-blue-100 text-blue-700',
  Couleur: 'bg-orange-100 text-orange-700',
  Lissage: 'bg-green-100 text-green-700',
  Locks: 'bg-yellow-100 text-yellow-700',
  Naturel: 'bg-teal-100 text-teal-700',
  Soin: 'bg-pink-100 text-pink-700',
  Chimique: 'bg-red-100 text-red-700',
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

export default function ServiceList({ prestations, onBook, selectable, selectedId }: ServiceListProps) {
  const categories = [...new Set(prestations.map((p) => p.categorie))];

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat}>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">{cat}</h4>
          <div className="space-y-2">
            {prestations.filter((p) => p.categorie === cat).map((p) => (
              <div
                key={p.id}
                onClick={() => selectable && onBook?.(p)}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  selectedId === p.id
                    ? 'border-primary bg-accent'
                    : 'border-gray-100 bg-white hover:border-secondary'
                } ${selectable ? 'cursor-pointer' : ''}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-dark text-sm">{p.nom}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[p.categorie] ?? 'bg-gray-100 text-gray-600'}`}>
                      {p.categorie}
                    </span>
                  </div>
                  {p.description && (
                    <p className="text-gray-500 text-xs mt-1 line-clamp-1">{p.description}</p>
                  )}
                  <span className="text-gray-400 text-xs mt-1 block">{formatDuration(p.duree)}</span>
                </div>

                <div className="flex items-center gap-3 ml-4">
                  <span className="text-lg font-bold text-primary">{p.prix}€</span>
                  {onBook && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onBook(p); }}
                      className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-pink-700 transition-colors whitespace-nowrap"
                    >
                      Réserver
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
