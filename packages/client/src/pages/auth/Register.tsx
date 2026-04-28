import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', nom: '', prenom: '', role: 'CLIENT' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères'); return; }
    setLoading(true);
    try {
      await register(form);
      navigate(form.role === 'COIFFEUR' ? '/pro/dashboard' : '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inscription échouée');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-accent flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-extrabold text-primary">Saloonify</Link>
          <p className="text-gray-500 text-sm mt-2">Créez votre compte gratuitement</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Prénom</label>
              <input type="text" required value={form.prenom} onChange={set('prenom')} placeholder="Marie"
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Nom</label>
              <input type="text" required value={form.nom} onChange={set('nom')} placeholder="Dupont"
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Email</label>
            <input type="email" required autoComplete="email" value={form.email} onChange={set('email')} placeholder="vous@exemple.fr"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Mot de passe</label>
            <input type="password" required autoComplete="new-password" value={form.password} onChange={set('password')} placeholder="Minimum 6 caractères"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Je suis</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'CLIENT', label: '👤 Client', desc: 'Je réserve des coiffeurs' },
                { value: 'COIFFEUR', label: '✂️ Coiffeur Pro', desc: 'Je gère mon salon' },
              ].map((opt) => (
                <label key={opt.value} className={`cursor-pointer p-3 rounded-xl border-2 transition-all ${form.role === opt.value ? 'border-primary bg-accent' : 'border-gray-100 hover:border-secondary'}`}>
                  <input type="radio" name="role" value={opt.value} checked={form.role === opt.value} onChange={set('role')} className="sr-only" />
                  <p className="font-semibold text-sm text-dark">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-pink-700 transition-colors disabled:opacity-50">
            {loading ? 'Inscription...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Déjà un compte ?{' '}
          <Link to="/auth/login" className="text-primary font-semibold hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
