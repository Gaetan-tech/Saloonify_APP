import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PRO_BOOKINGS } from '../../graphql/queries';
import { CONFIRM_BOOKING, CANCEL_BOOKING, TERMINATE_BOOKING } from '../../graphql/mutations';
import type { Booking } from '../../types';
import { STATUT_LABEL, STATUT_COLOR } from '../../lib/bookingStatus';

export default function Reservations() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');

  const { data, loading, refetch } = useQuery<{ proBookings: Booking[] }>(GET_PRO_BOOKINGS, {
    variables: { date: dateFilter || undefined },
  });

  const bookings = data?.proBookings ?? [];

  const [confirmBooking] = useMutation(CONFIRM_BOOKING, { onCompleted: () => refetch() });
  const [cancelBooking] = useMutation(CANCEL_BOOKING, { onCompleted: () => refetch() });
  const [terminateBooking] = useMutation(TERMINATE_BOOKING, { onCompleted: () => refetch() });

  const filtered = bookings.filter((b) => statusFilter === 'all' || b.statut === statusFilter);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-extrabold text-dark mb-6">Mes réservations</h1>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'Toutes' },
              { key: 'EN_ATTENTE', label: 'En attente' },
              { key: 'CONFIRME', label: 'Confirmées' },
              { key: 'TERMINE', label: 'Terminées' },
              { key: 'ANNULE', label: 'Annulées' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setStatusFilter(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${statusFilter === key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-accent'}`}>
                {label}
              </button>
            ))}
          </div>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary sm:ml-auto" />
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <p className="text-2xl mb-3">📭</p>
            <p className="text-gray-500 text-sm">Aucune réservation dans cette catégorie.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((b) => {
              const date = new Date(b.dateHeure);
              const isPast = date < new Date();
              return (
                <div key={b.id} className="border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent text-primary flex items-center justify-center font-bold flex-shrink-0">
                      {b.clientPrenom.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-dark text-sm">{b.clientPrenom} {b.clientNom}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUT_COLOR[b.statut] ?? ''}`}>
                          {STATUT_LABEL[b.statut] ?? b.statut}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{b.clientEmail}</p>
                      <p className="text-sm text-dark mt-1">{b.prestationNom} · {b.prestationDuree}min · <span className="font-semibold text-primary">{b.prestationPrix}€</span></p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 items-end ml-2">
                      {b.statut === 'EN_ATTENTE' && (
                        <>
                          <button onClick={() => confirmBooking({ variables: { id: b.id } })}
                            className="text-xs font-semibold text-green-600 border border-green-200 px-3 py-1 rounded-lg hover:bg-green-50 transition-colors whitespace-nowrap">
                            ✓ Confirmer
                          </button>
                          <button onClick={() => cancelBooking({ variables: { id: b.id } })}
                            className="text-xs font-semibold text-red-500 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap">
                            Annuler
                          </button>
                        </>
                      )}
                      {b.statut === 'CONFIRME' && !isPast && (
                        <button onClick={() => cancelBooking({ variables: { id: b.id } })}
                          className="text-xs font-semibold text-red-500 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap">
                          Annuler
                        </button>
                      )}
                      {b.statut === 'CONFIRME' && isPast && (
                        <button onClick={() => terminateBooking({ variables: { id: b.id } })}
                          className="text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">
                          Marquer terminé
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
