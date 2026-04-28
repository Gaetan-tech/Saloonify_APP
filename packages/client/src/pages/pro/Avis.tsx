import { useQuery } from '@apollo/client';
import { GET_MY_SALON, GET_REVIEWS } from '../../graphql/queries';
import StarRating from '../../components/StarRating';
import type { Salon, Review } from '../../types';

export default function Avis() {
  const { data: salonData } = useQuery<{ mySalon: Salon | null }>(GET_MY_SALON, { fetchPolicy: 'network-only' });
  const salon = salonData?.mySalon;

  const { data, loading } = useQuery<{ reviews: { reviews: Review[]; noteMoyenne: number; total: number } }>(
    GET_REVIEWS,
    { variables: { salonId: salon?.id, limit: 50, offset: 0 }, skip: !salon?.id },
  );

  const reviews = data?.reviews.reviews ?? [];
  const noteMoyenne = data?.reviews.noteMoyenne ?? salon?.note ?? 0;
  const total = data?.reviews.total ?? salon?.totalAvis ?? 0;

  const distribution = [5, 4, 3, 2, 1].map((n) => ({
    note: n,
    count: reviews.filter((r) => r.note === n).length,
    pct: total > 0 ? (reviews.filter((r) => r.note === n).length / total) * 100 : 0,
  }));

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-extrabold text-dark mb-8">Mes avis clients</h1>

        {/* Summary */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row gap-8 items-center">
          <div className="text-center">
            <p className="text-6xl font-extrabold text-primary">{noteMoyenne.toFixed(1)}</p>
            <StarRating note={noteMoyenne} size="lg" />
            <p className="text-sm text-gray-500 mt-1">{total} avis</p>
          </div>
          <div className="flex-1 w-full space-y-1.5">
            {distribution.map(({ note, count, pct }) => (
              <div key={note} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-4">{note}</span>
                <span className="text-yellow-400 text-xs">★</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-4">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews list */}
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }, (_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <p className="text-3xl mb-3">⭐</p>
            <p className="text-gray-500">Aucun avis reçu pour l'instant.</p>
            <p className="text-gray-400 text-sm mt-1">Les avis apparaîtront ici après vos premières prestations.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  {r.clientAvatar ? (
                    <img src={r.clientAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className="w-10 h-10 rounded-full bg-accent text-primary font-bold flex items-center justify-center">
                      {r.clientPrenom.charAt(0)}
                    </span>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-dark">{r.clientPrenom} {r.clientNom}</p>
                    <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <StarRating note={r.note} size="sm" />
                </div>
                {r.commentaire && <p className="text-sm text-gray-600 leading-relaxed pl-1">{r.commentaire}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
