import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_MY_SALON } from '../../graphql/queries';
import { CREATE_PRESTATION, UPDATE_PRESTATION, DELETE_PRESTATION } from '../../graphql/mutations';
import type { Prestation, Salon } from '../../types';

const CATEGORIES = ['Tresses', 'Coupe', 'Couleur', 'Lissage', 'Locks', 'Naturel', 'Soin', 'Chimique', 'Autre'];

const EMPTY_FORM = { nom: '', description: '', duree: 60, prix: 0, categorie: 'Coupe' };

export default function Prestations() {
  const { data, refetch } = useQuery<{ mySalon: Salon | null }>(GET_MY_SALON, { fetchPolicy: 'network-only' });
  const salon = data?.mySalon;

  const [editing, setEditing] = useState<Prestation | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [createPrestation, { loading: creating }] = useMutation(CREATE_PRESTATION, { onCompleted: () => { setAdding(false); setForm(EMPTY_FORM); refetch(); } });
  const [updatePrestation, { loading: updating }] = useMutation(UPDATE_PRESTATION, { onCompleted: () => { setEditing(null); refetch(); } });
  const [deletePrestation] = useMutation(DELETE_PRESTATION, { onCompleted: () => refetch() });

  const setField = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: k === 'duree' || k === 'prix' ? parseFloat(e.target.value) : e.target.value }));

  const startEdit = (p: Prestation) => {
    setEditing(p);
    setForm({ nom: p.nom, description: p.description ?? '', duree: p.duree, prix: p.prix, categorie: p.categorie });
    setAdding(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = { nom: form.nom, description: form.description, duree: form.duree, prix: form.prix, categorie: form.categorie };
    if (editing) { await updatePrestation({ variables: { id: editing.id, input } }); }
    else { await createPrestation({ variables: { salonId: salon?.id, input } }); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette prestation ?')) return;
    await deletePrestation({ variables: { id } });
  };

  const prestations = salon?.prestations ?? [];
  const loading = creating || updating;

  const PrestationForm = (
    <form onSubmit={handleSubmit} className="border border-primary/30 bg-accent rounded-2xl p-5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-dark mb-1">Nom de la prestation *</label>
          <input type="text" required value={form.nom} onChange={setField('nom')} placeholder="Ex: Box Braids"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-xs font-medium text-dark mb-1">Catégorie</label>
          <select value={form.categorie} onChange={setField('categorie')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-dark mb-1">Durée (minutes)</label>
          <input type="number" min="15" step="15" required value={form.duree} onChange={setField('duree')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-xs font-medium text-dark mb-1">Prix (€)</label>
          <input type="number" min="0" step="0.5" required value={form.prix} onChange={setField('prix')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-xs font-medium text-dark mb-1">Description</label>
          <input type="text" value={form.description} onChange={setField('description')} placeholder="Optionnel"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={loading}
          className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-pink-700 transition-colors disabled:opacity-50">
          {loading ? '...' : editing ? 'Mettre à jour' : 'Ajouter'}
        </button>
        <button type="button" onClick={() => { setAdding(false); setEditing(null); setForm(EMPTY_FORM); }}
          className="border border-gray-200 text-dark text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
          Annuler
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-extrabold text-dark">Mes prestations</h1>
          {!adding && !editing && salon && (
            <button onClick={() => { setAdding(true); setForm(EMPTY_FORM); }}
              className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-pink-700 transition-colors">
              + Ajouter
            </button>
          )}
        </div>

        {!salon && (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <p className="text-gray-500">Créez d'abord votre boutique pour gérer les prestations.</p>
          </div>
        )}

        {adding && PrestationForm}

        {prestations.length === 0 && salon && !adding && (
          <p className="text-gray-400 text-sm text-center py-8">Aucune prestation. Commencez par en ajouter une !</p>
        )}

        <div className="space-y-3 mt-4">
          {prestations.map((p) => (
            <div key={p.id}>
              {editing?.id === p.id ? PrestationForm : (
                <div className="flex items-center justify-between border border-gray-100 rounded-2xl p-4">
                  <div>
                    <p className="font-semibold text-dark text-sm">{p.nom}</p>
                    <p className="text-xs text-gray-400">{p.categorie} · {p.duree}min</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-primary">{p.prix}€</span>
                    <button onClick={() => startEdit(p)} className="text-xs text-gray-500 hover:text-primary transition-colors font-medium">Modifier</button>
                    <button onClick={() => handleDelete(p.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors font-medium">Supprimer</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
