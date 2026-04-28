import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { GET_DASHBOARD_PRO, GET_PRO_BOOKINGS } from '../../graphql/queries';
import type { DashboardPro, Booking } from '../../types';
import StarRating from '../../components/StarRating';
import { STATUT_LABEL, STATUT_COLOR_SIMPLE } from '../../lib/bookingStatus';

export default function Dashboard() {
  const today = new Date().toISOString().split('T')[0];
  const { data: dashData, loading: dashLoading } = useQuery<{ dashboardPro: DashboardPro }>(GET_DASHBOARD_PRO);
  const { data: bookingsData } = useQuery<{ proBookings: Booking[] }>(GET_PRO_BOOKINGS, { variables: { date: today } });

  const stats = dashData?.dashboardPro;
  const todayBookings = bookingsData?.proBookings ?? [];

  const cards = stats
    ? [
        { label: 'RDV aujourd\'hui', value: stats.rdvAujourdhui, icon: '📅', color: 'text-primary' },
        { label: 'RDV cette semaine', value: stats.rdvSemaine, icon: '🗓', color: 'text-blue-600' },
        { label: 'Note moyenne', value: stats.noteMoyenne.toFixed(1) + '★', icon: '⭐', color: 'text-yellow-500' },
        { label: 'Clients uniques', value: stats.totalClients, icon: '👥', color: 'text-purple-600' },
        { label: 'Avis reçus', value: stats.totalAvis, icon: '💬', color: 'text-green-600' },
        { label: 'Revenus ce mois', value: stats.revenusMois.toFixed(0) + '€', icon: '💰', color: 'text-emerald-600' },
      ]
    : [];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-extrabold text-dark">Tableau de bord</h1>
          <Link to="/pro/boutique" className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-pink-700 transition-colors">
            + Gérer ma boutique
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {dashLoading
            ? Array.from({ length: 6 }, (_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)
            : cards.map((card) => (
              <div key={card.label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
                <p className="text-2xl mb-1">{card.icon}</p>
                <p className={`text-xl font-extrabold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-gray-400 mt-1 leading-tight">{card.label}</p>
              </div>
            ))
          }
        </div>

        {/* Today's bookings */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="font-bold text-dark text-lg mb-4">Rendez-vous d'aujourd'hui</h2>
            {todayBookings.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl">
                <p className="text-3xl mb-3">📭</p>
                <p className="text-gray-500 text-sm">Aucun rendez-vous aujourd'hui</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayBookings.map((b) => (
                  <div key={b.id} className="flex items-center gap-4 border border-gray-100 rounded-2xl p-4">
                    <div className="w-12 h-12 rounded-full bg-accent text-primary flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {b.clientPrenom.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-dark text-sm">{b.clientPrenom} {b.clientNom}</p>
                      <p className="text-gray-500 text-xs">{b.prestationNom} · {b.prestationDuree}min</p>
                      <p className="text-primary font-semibold text-xs mt-0.5">
                        {new Date(b.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_COLOR_SIMPLE[b.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUT_LABEL[b.statut] ?? b.statut}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-bold text-dark text-lg mb-4">Navigation rapide</h2>
            <div className="space-y-2">
              {[
                { to: '/pro/boutique', label: '🏪 Ma boutique', desc: 'Modifier infos & photos' },
                { to: '/pro/prestations', label: '✂️ Mes prestations', desc: 'Gérer les services' },
                { to: '/pro/agenda', label: '📅 Mon agenda', desc: 'Voir les RDV en vue semaine' },
                { to: '/pro/reservations', label: '📋 Réservations', desc: 'Confirmer / annuler' },
                { to: '/pro/avis', label: '⭐ Mes avis', desc: 'Lire les retours clients' },
              ].map(({ to, label, desc }) => (
                <Link key={to} to={to} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3 hover:border-secondary hover:bg-accent transition-all group">
                  <span className="text-base">{label.split(' ')[0]}</span>
                  <div>
                    <p className="text-sm font-medium text-dark group-hover:text-primary transition-colors">{label.slice(2)}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
