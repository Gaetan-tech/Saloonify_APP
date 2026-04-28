import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_PRO_BOOKINGS } from '../../graphql/queries';
import AgendaWeekView from '../../components/AgendaWeekView';
import type { Booking } from '../../types';
import { STATUT_LABEL, STATUT_COLOR } from '../../lib/bookingStatus';

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default function Agenda() {
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const { data, loading } = useQuery<{ proBookings: Booking[] }>(GET_PRO_BOOKINGS);
  const bookings = data?.proBookings ?? [];

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };
  const goToday = () => setWeekStart(getMonday(new Date()));

  const endOfWeek = new Date(weekStart);
  endOfWeek.setDate(weekStart.getDate() + 6);

  const weekBookings = bookings.filter((b) => {
    const d = new Date(b.dateHeure);
    return d >= weekStart && d <= endOfWeek;
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-extrabold text-dark">Mon agenda</h1>
          <div className="flex items-center gap-2">
            <button onClick={prevWeek} className="border border-gray-200 rounded-xl px-3 py-2 text-sm hover:bg-gray-50 transition-colors">← Semaine préc.</button>
            <button onClick={goToday} className="border border-primary text-primary rounded-xl px-4 py-2 text-sm font-semibold hover:bg-accent transition-colors">Aujourd'hui</button>
            <button onClick={nextWeek} className="border border-gray-200 rounded-xl px-3 py-2 text-sm hover:bg-gray-50 transition-colors">Semaine suiv. →</button>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          {weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} – {endOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          <span className="ml-2 text-primary font-semibold">{weekBookings.length} RDV</span>
        </p>

        {loading ? (
          <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
        ) : (
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <AgendaWeekView bookings={weekBookings} weekStart={weekStart} onBookingClick={setSelectedBooking} />
          </div>
        )}

        {selectedBooking && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBooking(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-dark">Détails du RDV</h3>
                <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-dark">✕</button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Client</span><span className="font-medium">{selectedBooking.clientPrenom} {selectedBooking.clientNom}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{selectedBooking.clientEmail}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Prestation</span><span className="font-medium">{selectedBooking.prestationNom}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Durée</span><span className="font-medium">{selectedBooking.prestationDuree}min</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Prix</span><span className="font-bold text-primary">{selectedBooking.prestationPrix}€</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Heure</span><span className="font-medium">{new Date(selectedBooking.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Statut</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUT_COLOR[selectedBooking.statut] ?? ''}`}>
                    {STATUT_LABEL[selectedBooking.statut] ?? selectedBooking.statut}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
