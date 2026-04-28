import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_SALONS } from '../graphql/queries';
import SalonCard from '../components/SalonCard';
import MapView from '../components/MapView';
import type { Salon } from '../types';

interface Filters {
  noteMin: number;
  prixMax: number;
  categorie: string;
  rayon: number;
}

export default function Explore() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [filters, setFilters] = useState<Filters>({ noteMin: 0, prixMax: 0, categorie: q, rayon: 10 });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserPos({ lat: 48.8566, lng: 2.3522 }),
      );
    }
  }, []);

  const { data, loading } = useQuery<{ salons: { salons: Salon[]; total: number } }>(GET_SALONS, {
    variables: {
      filter: {
        lat: userPos?.lat ?? 48.8566,
        lng: userPos?.lng ?? 2.3522,
        rayon: filters.rayon,
        categorie: filters.categorie,
        prixMax: filters.prixMax,
        noteMin: filters.noteMin,
        limit: 50,
      },
    },
  });

  const salons = data?.salons.salons ?? [];
  const total = data?.salons.total ?? 0;

  const setFilter = (k: keyof Filters) => (v: number | string) =>
    setFilters((p) => ({ ...p, [k]: v }));

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-5 sticky top-20">
              <h2 className="font-bold text-dark">Filtres</h2>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Catégorie</label>
                <select
                  value={filters.categorie}
                  onChange={(e) => setFilter('categorie')(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Toutes</option>
                  {['Tresses', 'Coupe', 'Couleur', 'Lissage', 'Locks', 'Naturel', 'Soin', 'Chimique'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  Note minimale : {filters.noteMin > 0 ? `${filters.noteMin}★` : 'Toutes'}
                </label>
                <input type="range" min="0" max="5" step="0.5" value={filters.noteMin}
                  onChange={(e) => setFilter('noteMin')(parseFloat(e.target.value))}
                  className="w-full accent-primary" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  Prix max : {filters.prixMax > 0 ? `${filters.prixMax}€` : 'Tous'}
                </label>
                <input type="range" min="0" max="200" step="10" value={filters.prixMax}
                  onChange={(e) => setFilter('prixMax')(parseInt(e.target.value))}
                  className="w-full accent-primary" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  Rayon : {filters.rayon} km
                </label>
                <input type="range" min="1" max="50" step="1" value={filters.rayon}
                  onChange={(e) => setFilter('rayon')(parseInt(e.target.value))}
                  className="w-full accent-primary" />
              </div>

              <button
                onClick={() => setFilters({ noteMin: 0, prixMax: 0, categorie: '', rayon: 10 })}
                className="text-xs text-gray-400 hover:text-primary transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <p className="text-gray-500 text-sm">
                {loading ? 'Chargement...' : `${total} salon${total !== 1 ? 's' : ''} trouvé${total !== 1 ? 's' : ''}`}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setView('list')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${view === 'list' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-accent'}`}>
                  ☰ Liste
                </button>
                <button onClick={() => setView('map')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${view === 'map' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-accent'}`}>
                  🗺 Carte
                </button>
              </div>
            </div>

            {view === 'map' ? (
              <div className="h-[600px] rounded-2xl overflow-hidden border border-gray-100">
                <MapView salons={salons} userLat={userPos?.lat} userLng={userPos?.lng} />
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="h-56 bg-gray-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : salons.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">✂️</p>
                <p className="text-dark font-semibold text-lg">Aucun salon trouvé</p>
                <p className="text-gray-500 text-sm mt-2">Essayez d'élargir votre rayon ou de modifier vos filtres.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {salons.map((salon) => <SalonCard key={salon.id} salon={salon} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
