import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_MY_SALON } from '../../graphql/queries';
import { CREATE_SALON, UPDATE_SALON } from '../../graphql/mutations';
import AvailabilityEditor from '../../components/AvailabilityEditor';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import type { Salon } from '../../types';

export default function Boutique() {
  const { data, loading, refetch } = useQuery<{ mySalon: Salon | null }>(GET_MY_SALON, { fetchPolicy: 'network-only' });
  const salon = data?.mySalon;

  const [form, setForm] = useState({
    nom: '', description: '', adresse: '', lat: 48.8566, lng: 2.3522, photos: [] as string[],
  });
  const [photoUrl, setPhotoUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (salon) {
      setForm({ nom: salon.nom, description: salon.description, adresse: salon.adresse, lat: salon.lat, lng: salon.lng, photos: salon.photos });
    }
  }, [salon]);

  const [createSalon, { loading: creating }] = useMutation(CREATE_SALON, { onCompleted: () => { setSaved(true); refetch(); } });
  const [updateSalon, { loading: updating }] = useMutation(UPDATE_SALON, { onCompleted: () => { setSaved(true); refetch(); setTimeout(() => setSaved(false), 3000); } });

  const mutating = creating || updating;

  const addPhoto = () => {
    if (!photoUrl.trim()) return;
    setForm((p) => ({ ...p, photos: [...p.photos, photoUrl.trim()] }));
    setPhotoUrl('');
  };

  const removePhoto = (i: number) => setForm((p) => ({ ...p, photos: p.photos.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    const input = { nom: form.nom, description: form.description, adresse: form.adresse, lat: form.lat, lng: form.lng, photos: form.photos };
    if (salon) { await updateSalon({ variables: { id: salon.id, input } }); }
    else { await createSalon({ variables: { input } }); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Chargement...</div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-extrabold text-dark mb-8">
          {salon ? 'Ma boutique' : 'Créer ma boutique'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-dark">Informations générales</h2>
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Nom du salon *</label>
              <input type="text" required value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                placeholder="Mon Salon de Coiffure"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Description *</label>
              <textarea required value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={4} placeholder="Décrivez votre salon, votre spécialité, votre ambiance..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Adresse *</label>
              <AddressAutocomplete
                value={form.adresse}
                required
                onChange={(adresse, lat, lng) =>
                  setForm((p) => ({
                    ...p,
                    adresse,
                    ...(lat !== undefined && lng !== undefined ? { lat, lng } : {}),
                  }))
                }
              />
              {form.lat !== 48.8566 && (
                <p className="text-xs text-green-600 mt-1">✓ Coordonnées : {form.lat.toFixed(4)}, {form.lng.toFixed(4)}</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-dark">Photos ({form.photos.length}/10)</h2>
            <div className="flex gap-2">
              <input type="url" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://exemple.com/photo.jpg"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              <button type="button" onClick={addPhoto} disabled={!photoUrl.trim()}
                className="bg-primary text-white text-sm font-semibold px-4 py-3 rounded-xl hover:bg-pink-700 transition-colors disabled:opacity-50">
                Ajouter
              </button>
            </div>
            {form.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {form.photos.map((url, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden h-24">
                    <img src={url} alt={`photo ${i + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity font-bold flex items-center justify-center">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {saved && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">✓ Boutique {salon ? 'mise à jour' : 'créée'} avec succès !</div>}

          <button type="submit" disabled={mutating}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-pink-700 transition-colors disabled:opacity-50">
            {mutating ? 'Enregistrement...' : salon ? 'Enregistrer les modifications' : 'Créer ma boutique'}
          </button>
        </form>

        {salon && (
          <div className="mt-8 bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="font-bold text-dark mb-4">Horaires d'ouverture</h2>
            <AvailabilityEditor salonId={salon.id} initialHoraires={salon.horaires} />
          </div>
        )}
      </div>
    </div>
  );
}
