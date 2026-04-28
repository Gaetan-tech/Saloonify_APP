import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { UPDATE_PROFILE } from '../graphql/mutations';
import { GET_ME } from '../graphql/queries';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';

export default function Profile() {
  const { user, logout } = useAuth();
  const { data, refetch } = useQuery<{ me: User }>(GET_ME);
  const profile = data?.me ?? user;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nom: profile?.nom ?? '', prenom: profile?.prenom ?? '', avatar: profile?.avatar ?? '' });
  const [saved, setSaved] = useState(false);

  const [updateProfile, { loading }] = useMutation(UPDATE_PROFILE, {
    onCompleted: () => { setSaved(true); setEditing(false); refetch(); setTimeout(() => setSaved(false), 3000); },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ variables: { nom: form.nom, prenom: form.prenom, avatar: form.avatar || undefined } });
  };

  if (!profile) return <div className="min-h-screen flex items-center justify-center text-gray-400">Chargement...</div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-extrabold text-dark mb-8">Mon profil</h1>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            {profile.avatar ? (
              <img src={profile.avatar} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <span className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
                {profile.prenom.charAt(0)}
              </span>
            )}
            <div>
              <p className="font-bold text-dark text-lg">{profile.prenom} {profile.nom}</p>
              <p className="text-gray-500 text-sm">{profile.email}</p>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${profile.role === 'COIFFEUR' ? 'bg-primary text-white' : 'bg-accent text-primary'}`}>
                {profile.role === 'COIFFEUR' ? '✂️ Coiffeur Pro' : '👤 Client'}
              </span>
            </div>
          </div>

          {!editing ? (
            <button onClick={() => { setForm({ nom: profile.nom, prenom: profile.prenom, avatar: profile.avatar ?? '' }); setEditing(true); }}
              className="text-sm text-primary font-semibold hover:underline">
              Modifier mes informations
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-dark mb-1.5">Prénom</label>
                  <input type="text" value={form.prenom} onChange={(e) => setForm((p) => ({ ...p, prenom: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark mb-1.5">Nom</label>
                  <input type="text" value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-dark mb-1.5">URL de l'avatar</label>
                <input type="url" value={form.avatar} onChange={(e) => setForm((p) => ({ ...p, avatar: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading}
                  className="bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-pink-700 transition-colors disabled:opacity-50 text-sm">
                  {loading ? 'Enregistrement...' : 'Sauvegarder'}
                </button>
                <button type="button" onClick={() => setEditing(false)}
                  className="border border-gray-200 text-dark font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                  Annuler
                </button>
              </div>
            </form>
          )}
          {saved && <p className="text-green-600 text-sm mt-3 font-medium">✓ Profil mis à jour !</p>}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="font-bold text-dark mb-4">Sécurité du compte</h2>
          <p className="text-sm text-gray-500 mb-4">Email : <strong>{profile.email}</strong></p>
          <button onClick={logout} className="text-sm text-red-500 font-medium border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
