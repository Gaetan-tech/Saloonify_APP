import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_SALON } from '../graphql/queries';
import { CREATE_BOOKING } from '../graphql/mutations';
import ServiceList from '../components/ServiceList';
import BookingCalendar from '../components/BookingCalendar';
import type { Salon, Prestation } from '../types';
import { useAuth } from '../contexts/AuthContext';

type Step = 'service' | 'slot' | 'confirm' | 'success';

export default function Booking() {
  const { salonId } = useParams<{ salonId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const initPrestationId = searchParams.get('prestationId') ?? '';
  const [step, setStep] = useState<Step>(initPrestationId ? 'slot' : 'service');
  const [selectedPrestation, setSelectedPrestation] = useState<Prestation | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const { data } = useQuery<{ salon: Salon }>(GET_SALON, { variables: { id: salonId } });
  const salon = data?.salon;

  const prestationFromUrl = salon?.prestations.find((p) => p.id === initPrestationId) ?? null;
  const activePrestation = selectedPrestation ?? prestationFromUrl;

  // If salon loaded but URL prestationId doesn't match any prestation, fall back to service selection
  useEffect(() => {
    if (salon && initPrestationId && !prestationFromUrl && step === 'slot') {
      setStep('service');
    }
  }, [salon, initPrestationId, prestationFromUrl, step]);

  const [createBooking, { loading: bookingLoading }] = useMutation(CREATE_BOOKING, {
    onCompleted: () => setStep('success'),
  });

  const handleSelectPrestation = (p: Prestation) => {
    setSelectedPrestation(p);
    setStep('slot');
  };

  const handleConfirm = async () => {
    if (!isAuthenticated) { navigate('/auth/login', { state: { from: `/booking/${salonId}` } }); return; }
    if (!activePrestation || !selectedSlot || !salonId) return;
    await createBooking({ variables: { salonId, prestationId: activePrestation.id, dateHeure: selectedSlot } });
  };

  if (!salon) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-center text-gray-400">Chargement...</div></div>;
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-2xl font-extrabold text-dark mb-3">Réservation confirmée !</h1>
          <p className="text-gray-500 mb-2">Votre rendez-vous chez <strong>{salon.nom}</strong> a bien été enregistré.</p>
          {selectedSlot && (
            <p className="text-primary font-semibold mb-6">
              {new Date(selectedSlot).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {new Date(selectedSlot).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <Link to="/my-bookings" className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-pink-700 transition-colors">
              Voir mes RDV
            </Link>
            <Link to="/" className="border border-gray-200 text-dark font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors">
              Accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link to={`/salon/${salonId}`} className="text-gray-400 text-sm hover:text-primary transition-colors mb-6 block">
          ← Retour au salon
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-dark">Réserver chez {salon.nom}</h1>

          {/* Progress */}
          <div className="flex items-center gap-2 mt-4">
            {(['service', 'slot', 'confirm'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s ? 'bg-primary text-white' : (['slot', 'confirm'].indexOf(step) > i || (step === 'confirm' && i < 2)) ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>{i + 1}</div>
                <span className={`text-xs font-medium ${step === s ? 'text-primary' : 'text-gray-400'}`}>
                  {s === 'service' ? 'Prestation' : s === 'slot' ? 'Créneau' : 'Confirmation'}
                </span>
                {i < 2 && <div className="w-8 h-0.5 bg-gray-100 mx-1" />}
              </div>
            ))}
          </div>
        </div>

        {step === 'service' && (
          <div>
            <h2 className="font-semibold text-dark mb-4">Choisissez une prestation</h2>
            <ServiceList prestations={salon.prestations} onBook={handleSelectPrestation} selectable />
          </div>
        )}

        {step === 'slot' && activePrestation && (
          <div>
            <div className="bg-accent rounded-2xl p-4 mb-6">
              <p className="text-sm text-dark font-medium">{activePrestation.nom}</p>
              <p className="text-xs text-gray-500">{activePrestation.duree}min — {activePrestation.prix}€</p>
            </div>
            <h2 className="font-semibold text-dark mb-4">Choisissez un créneau</h2>
            <BookingCalendar
              salonId={salonId!}
              prestationId={activePrestation.id}
              onSlotSelect={setSelectedSlot}
              selectedSlot={selectedSlot}
            />
            {selectedSlot && (
              <button onClick={() => setStep('confirm')}
                className="mt-6 w-full bg-primary text-white font-semibold py-3.5 rounded-xl hover:bg-pink-700 transition-colors">
                Continuer →
              </button>
            )}
          </div>
        )}

        {step === 'confirm' && activePrestation && selectedSlot && (
          <div>
            <h2 className="font-semibold text-dark mb-6">Confirmez votre réservation</h2>
            <div className="border border-gray-100 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Salon</span>
                <span className="font-medium text-dark">{salon.nom}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Prestation</span>
                <span className="font-medium text-dark">{activePrestation.nom}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Durée</span>
                <span className="font-medium text-dark">{activePrestation.duree}min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date & heure</span>
                <span className="font-medium text-dark">
                  {new Date(selectedSlot).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {new Date(selectedSlot).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-bold text-dark">Total</span>
                <span className="font-extrabold text-primary text-lg">{activePrestation.prix}€</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep('slot')} className="flex-1 border border-gray-200 text-dark font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors">
                ← Modifier
              </button>
              <button onClick={handleConfirm} disabled={bookingLoading}
                className="flex-1 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-pink-700 transition-colors disabled:opacity-50">
                {bookingLoading ? 'Réservation...' : 'Confirmer la réservation'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
