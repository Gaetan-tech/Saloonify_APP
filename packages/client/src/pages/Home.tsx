import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_SALONS } from '../graphql/queries';
import SalonCard from '../components/SalonCard';
import type { Salon } from '../types';

const HOW_IT_WORKS = [
  { icon: '🔍', title: 'Trouvez', desc: 'Recherchez parmi des centaines de coiffeurs indépendants autour de vous.' },
  { icon: '📅', title: 'Réservez', desc: 'Choisissez votre prestation et un créneau disponible en quelques clics.' },
  { icon: '✂️', title: 'Profitez', desc: 'Rendez-vous confirmé, vivez votre expérience beauté et laissez un avis.' },
];

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data } = useQuery<{ salons: { salons: Salon[] } }>(GET_SALONS, {
    variables: { filter: { limit: 6 } },
  });

  const popularSalons = data?.salons.salons ?? [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/explore${search ? `?q=${encodeURIComponent(search)}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-dark via-dark to-primary overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #E91E8C 0%, transparent 60%)' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Votre coiffeur idéal,{' '}
              <span className="text-secondary">à portée de main</span>
            </h1>
            <p className="mt-4 text-lg text-gray-300 leading-relaxed">
              Découvrez des coiffeurs indépendants talentueux près de chez vous. Réservez en ligne, sans prise de tête.
            </p>

            <form onSubmit={handleSearch} className="mt-8 flex gap-3 flex-col sm:flex-row max-w-lg">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Tresses, lissage, coloration..."
                className="flex-1 px-5 py-4 rounded-2xl text-dark font-medium bg-white focus:outline-none focus:ring-2 focus:ring-secondary shadow-lg"
              />
              <button type="submit" className="bg-primary hover:bg-pink-700 text-white font-bold px-8 py-4 rounded-2xl transition-colors shadow-lg whitespace-nowrap">
                Rechercher →
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-2">
              {['Tresses', 'Coloration', 'Coupe Homme', 'Lissage', 'Locks'].map((tag) => (
                <button key={tag} onClick={() => navigate(`/explore?q=${tag}`)}
                  className="text-xs font-medium text-white/70 border border-white/20 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors">
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popular salons */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-dark">Salons populaires</h2>
            <p className="text-gray-500 text-sm mt-1">Les coiffeurs les mieux notés près de Paris</p>
          </div>
          <button onClick={() => navigate('/explore')} className="text-primary font-semibold text-sm hover:underline">
            Voir tout →
          </button>
        </div>

        {popularSalons.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-56 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {popularSalons.map((salon) => (
              <SalonCard key={salon.id} salon={salon} />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-dark text-center mb-12">Comment ça marche ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl mb-4">{step.icon}</div>
                <span className="inline-block bg-primary text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                  Étape {i + 1}
                </span>
                <h3 className="text-lg font-bold text-dark mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA for pros */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-dark rounded-3xl p-10 lg:p-14">
          <h2 className="text-3xl font-extrabold text-white mb-4">Vous êtes coiffeur indépendant ?</h2>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            Rejoignez Saloonify et gérez vos réservations en ligne. Visibilité gratuite, agenda numérique, zéro friction.
          </p>
          <button onClick={() => navigate('/auth/register')} className="bg-primary text-white font-bold px-10 py-4 rounded-2xl hover:bg-pink-700 transition-colors text-lg">
            Créer ma boutique →
          </button>
        </div>
      </section>
    </div>
  );
}
