import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import type { Salon } from '../types';

interface SalonCardProps {
  salon: Salon;
}

export default function SalonCard({ salon }: SalonCardProps) {
  const cover = salon.photos[0] ?? 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400';
  const prixMin = salon.prestations.length
    ? Math.min(...salon.prestations.map((p) => p.prix))
    : null;

  return (
    <Link to={`/salon/${salon.id}`} className="group block bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
      <div className="relative overflow-hidden h-44">
        <img
          src={cover}
          alt={salon.nom}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400'; }}
        />
        {salon.distance != null && salon.distance > 0 && (
          <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-xs font-semibold text-dark px-2 py-1 rounded-full">
            {salon.distance < 1 ? `${Math.round(salon.distance * 1000)}m` : `${salon.distance.toFixed(1)}km`}
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-dark text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {salon.nom}
        </h3>
        <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{salon.adresse}</p>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5">
            <StarRating note={salon.note} size="sm" />
            <span className="text-xs text-gray-400">({salon.totalAvis})</span>
          </div>
          {prixMin != null && (
            <span className="text-sm font-semibold text-primary">
              à partir de {prixMin}€
            </span>
          )}
        </div>

        {salon.prestations.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {[...new Set(salon.prestations.map((p) => p.categorie))].slice(0, 3).map((cat) => (
              <span key={cat} className="text-xs bg-accent text-primary font-medium px-2 py-0.5 rounded-full">
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
