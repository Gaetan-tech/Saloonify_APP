import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_SALON, GET_REVIEWS } from '../graphql/queries';
import StarRating from '../components/StarRating';
import ServiceList from '../components/ServiceList';
import ReviewForm from '../components/ReviewForm';
import MapView from '../components/MapView';
import type { Salon, Review, Prestation } from '../types';

const JOURS_FR: Record<string, string> = {
  LUNDI: 'Lun', MARDI: 'Mar', MERCREDI: 'Mer', JEUDI: 'Jeu',
  VENDREDI: 'Ven', SAMEDI: 'Sam', DIMANCHE: 'Dim',
};

export default function SalonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: salonData, loading: salonLoading } = useQuery<{ salon: Salon }>(GET_SALON, { variables: { id } });
  const { data: reviewData } = useQuery<{ reviews: { reviews: Review[]; noteMoyenne: number; total: number } }>(
    GET_REVIEWS, { variables: { salonId: id, limit: 10, offset: 0 }, skip: !id },
  );

  const salon = salonData?.salon;
  const reviews = reviewData?.reviews.reviews ?? [];

  const handleBook = (prestation: Prestation) => {
    navigate(`/booking/${salon?.id}?prestationId=${prestation.id}`);
  };

  if (salonLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-72 bg-gray-100 animate-pulse" />
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
          <div className="h-8 bg-gray-100 rounded-xl animate-pulse w-64" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-40" />
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center"><p className="text-4xl mb-4">✂️</p><p className="text-gray-500">Salon introuvable</p></div>
      </div>
    );
  }

  const photos = salon.photos.length > 0 ? salon.photos : ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'];

  return (
    <div className="min-h-screen bg-white">
      {/* Photo gallery */}
      <div className="relative h-72 md:h-96 bg-dark overflow-hidden">
        <img src={photos[photoIdx]} alt={salon.nom} className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'; }} />
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {photos.map((_, i) => (
              <button key={i} onClick={() => setPhotoIdx(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === photoIdx ? 'bg-white scale-125' : 'bg-white/50'}`} />
            ))}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-10">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-10">
            <div>
              <h1 className="text-3xl font-extrabold text-dark">{salon.nom}</h1>
              <p className="text-gray-500 text-sm mt-1">{salon.adresse}</p>
              <div className="flex items-center gap-3 mt-3">
                <StarRating note={salon.note} size="md" />
                <span className="text-gray-500 text-sm">({salon.totalAvis} avis)</span>
              </div>
              <p className="text-gray-600 text-sm mt-4 leading-relaxed">{salon.description}</p>
              <p className="text-sm text-dark mt-2">
                Coiffeur : <span className="font-semibold">{salon.coiffeurPrenom} {salon.coiffeurNom}</span>
              </p>
            </div>

            {/* Services */}
            <section>
              <h2 className="text-xl font-bold text-dark mb-4">Nos prestations</h2>
              <ServiceList prestations={salon.prestations} onBook={handleBook} />
            </section>

            {/* Horaires */}
            {salon.horaires.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-dark mb-4">Horaires</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {salon.horaires.map((h) => (
                    <div key={h.id} className={`rounded-xl p-3 text-center ${h.ouvert ? 'bg-green-50 border border-green-100' : 'bg-gray-50 opacity-60'}`}>
                      <p className="font-semibold text-xs text-dark">{JOURS_FR[h.jour] ?? h.jour}</p>
                      {h.ouvert ? (
                        <p className="text-xs text-green-700 mt-1">{h.heureDebut} – {h.heureFin}</p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1">Fermé</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Map */}
            <section>
              <h2 className="text-xl font-bold text-dark mb-4">Localisation</h2>
              <div className="h-56 rounded-2xl overflow-hidden border border-gray-100">
                <MapView salons={[salon]} />
              </div>
            </section>

            {/* Reviews */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-dark">Avis clients</h2>
                <button onClick={() => setShowReviewForm(!showReviewForm)}
                  className="text-sm text-primary font-semibold hover:underline">
                  {showReviewForm ? 'Annuler' : 'Laisser un avis'}
                </button>
              </div>

              {showReviewForm && (
                <div className="bg-accent rounded-2xl p-5 mb-6">
                  <ReviewForm salonId={salon.id} onSuccess={() => setShowReviewForm(false)} />
                </div>
              )}

              {reviews.length === 0 ? (
                <p className="text-gray-400 text-sm">Aucun avis pour l'instant. Soyez le premier !</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="border border-gray-100 rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        {r.clientAvatar ? (
                          <img src={r.clientAvatar} alt="avatar" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <span className="w-9 h-9 rounded-full bg-accent text-primary flex items-center justify-center font-bold text-sm">
                            {r.clientPrenom.charAt(0)}
                          </span>
                        )}
                        <div>
                          <p className="font-semibold text-sm text-dark">{r.clientPrenom} {r.clientNom}</p>
                          <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div className="ml-auto"><StarRating note={r.note} size="sm" /></div>
                      </div>
                      {r.commentaire && <p className="text-sm text-gray-600 leading-relaxed">{r.commentaire}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sticky sidebar */}
          <div className="mt-8 lg:mt-0">
            <div className="sticky top-20 bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <p className="font-bold text-dark text-lg mb-1">{salon.nom}</p>
              <StarRating note={salon.note} size="sm" />
              <p className="text-sm text-gray-500 mt-2 mb-4">{salon.prestations.length} prestation{salon.prestations.length !== 1 ? 's' : ''} disponible{salon.prestations.length !== 1 ? 's' : ''}</p>
              {salon.prestations.length > 0 && (
                <p className="text-2xl font-extrabold text-primary mb-4">
                  à partir de {Math.min(...salon.prestations.map((p) => p.prix))}€
                </p>
              )}
              <button
                onClick={() => navigate(`/booking/${salon.id}`)}
                className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-pink-700 transition-colors"
              >
                Réserver maintenant →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
