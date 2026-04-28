import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Link } from 'react-router-dom';
import { GET_MY_BOOKINGS } from '../graphql/queries';
import { CANCEL_BOOKING } from '../graphql/mutations';
import type { Booking } from '../types';
import { STATUT_CONFIG } from '../lib/bookingStatus';

export default function MyBookings() {
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const { data, loading } = useQuery<{ myBookings: Booking[] }>(GET_MY_BOOKINGS);
  const [cancelBooking] = useMutation(CANCEL_BOOKING, { refetchQueries: [{ query: GET_MY_BOOKINGS }] });

  const bookings = data?.myBookings ?? [];
  const now = new Date();

  const filtered = bookings.filter((b) => {
    const d = new Date(b.dateHeure);
    if (filter === 'upcoming') return d > now && b.statut !== 'ANNULE';
    if (filter === 'past') return d <= now || b.statut === 'TERMINE' || b.statut === 'ANNULE';
    return true;
  });

  const handleCancel = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) return;
    await cancelBooking({ variables: { id } });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-extrabold text-dark mb-6">Mes rendez-vous</h1>

        <div className="flex gap-2 mb-6">
          {[
            { key: 'upcoming', label: 'À venir' },
            { key: 'past', label: 'Passés' },
            { key: 'all', label: 'Tous' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key as typeof filter)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-accent'}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }, (_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📅</p>
            <p className="font-semibold text-dark text-lg">Aucun rendez-vous</p>
            <p className="text-gray-500 text-sm mt-2 mb-6">Trouvez un coiffeur et réservez en quelques clics.</p>
            <Link to="/explore" className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-pink-700 transition-colors">
              Explorer les salons
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((b) => {
              const statut = STATUT_CONFIG[b.statut];
              const date = new Date(b.dateHeure);
              const isPast = date <= now;
              const canCancel = !isPast && b.statut !== 'ANNULE' && b.statut !== 'TERMINE';
              return (
                <div key={b.id} className={`border rounded-2xl p-5 ${statut?.bg ?? 'bg-white border-gray-100'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-dark">{b.salonNom}</p>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statut?.bg ?? ''} ${statut?.color ?? ''}`}>
                          {statut?.label ?? b.statut}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{b.prestationNom} · {b.prestationDuree}min · {b.prestationPrix}€</p>
                      <p className="text-sm font-semibold text-dark mt-2">
                        {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à{' '}
                        {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                      <Link to={`/salon/${b.salonId}`} className="text-xs text-primary font-medium hover:underline whitespace-nowrap">
                        Voir le salon
                      </Link>
                      {canCancel && (
                        <button onClick={() => handleCancel(b.id)}
                          className="text-xs text-red-500 font-medium hover:underline whitespace-nowrap">
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
