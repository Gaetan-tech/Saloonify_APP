import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import type { Salon } from '../types';
import StarRating from './StarRating';

const pinkIcon = new L.DivIcon({
  html: `<div style="background:#E91E8C;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(233,30,140,0.4)"></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  className: '',
});

const userIcon = new L.DivIcon({
  html: `<div style="background:#1A1A2E;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  className: '',
});

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 13, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

interface MapViewProps {
  salons: Salon[];
  userLat?: number;
  userLng?: number;
  selectedSalonId?: string;
  onSalonClick?: (id: string) => void;
}

export default function MapView({ salons, userLat, userLng, onSalonClick }: MapViewProps) {
  const center: [number, number] = userLat && userLng
    ? [userLat, userLng]
    : salons.length > 0
    ? [salons[0].lat, salons[0].lng]
    : [48.8566, 2.3522];

  return (
    <MapContainer center={center} zoom={13} className="w-full h-full rounded-xl" scrollWheelZoom>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {userLat && userLng && (
        <>
          <Marker position={[userLat, userLng]} icon={userIcon}>
            <Popup><span className="text-sm font-medium">Vous êtes ici</span></Popup>
          </Marker>
          <FlyTo lat={userLat} lng={userLng} />
        </>
      )}

      {salons.map((salon) => (
        <Marker
          key={salon.id}
          position={[salon.lat, salon.lng]}
          icon={pinkIcon}
          eventHandlers={{ click: () => onSalonClick?.(salon.id) }}
        >
          <Popup maxWidth={220}>
            <div className="text-sm">
              <img
                src={salon.photos[0] ?? ''}
                alt={salon.nom}
                className="w-full h-20 object-cover rounded-lg mb-2"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <p className="font-semibold text-dark">{salon.nom}</p>
              <p className="text-gray-500 text-xs">{salon.adresse}</p>
              <StarRating note={salon.note} size="sm" />
              <Link to={`/salon/${salon.id}`} className="mt-2 block text-center bg-primary text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-pink-700 transition-colors">
                Voir le salon →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
