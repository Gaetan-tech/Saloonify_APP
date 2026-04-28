import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { SET_HORAIRES } from '../graphql/mutations';
import type { Horaire } from '../types';

interface AvailabilityEditorProps {
  salonId: string;
  initialHoraires: Horaire[];
  onSaved?: () => void;
}

const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
const JOURS_FR: Record<string, string> = {
  LUNDI: 'Lundi', MARDI: 'Mardi', MERCREDI: 'Mercredi', JEUDI: 'Jeudi',
  VENDREDI: 'Vendredi', SAMEDI: 'Samedi', DIMANCHE: 'Dimanche',
};

interface DayConfig { jour: string; ouvert: boolean; heureDebut: string; heureFin: string }

function buildInitial(horaires: Horaire[]): DayConfig[] {
  return JOURS.map((jour) => {
    const h = horaires.find((x) => x.jour === jour);
    return { jour, ouvert: h?.ouvert ?? true, heureDebut: h?.heureDebut ?? '09:00', heureFin: h?.heureFin ?? '19:00' };
  });
}

export default function AvailabilityEditor({ salonId, initialHoraires, onSaved }: AvailabilityEditorProps) {
  const [days, setDays] = useState<DayConfig[]>(buildInitial(initialHoraires));
  const [saved, setSaved] = useState(false);

  const [setHoraires, { loading, error }] = useMutation(SET_HORAIRES, {
    onCompleted: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); onSaved?.(); },
  });

  const update = (i: number, patch: Partial<DayConfig>) => {
    setDays((prev) => prev.map((d, idx) => idx === i ? { ...d, ...patch } : d));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await setHoraires({ variables: { salonId, horaires: days } });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {days.map((day, i) => (
        <div key={day.jour} className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${day.ouvert ? 'border-gray-100 bg-white' : 'border-gray-50 bg-gray-50 opacity-60'}`}>
          <label className="flex items-center gap-2 min-w-[120px] cursor-pointer">
            <input
              type="checkbox"
              checked={day.ouvert}
              onChange={(e) => update(i, { ouvert: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm font-medium text-dark">{JOURS_FR[day.jour]}</span>
          </label>

          {day.ouvert ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="time"
                value={day.heureDebut}
                onChange={(e) => update(i, { heureDebut: e.target.value })}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-gray-400 text-sm">→</span>
              <input
                type="time"
                value={day.heureFin}
                onChange={(e) => update(i, { heureFin: e.target.value })}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ) : (
            <span className="text-gray-400 text-sm italic flex-1">Fermé</span>
          )}
        </div>
      ))}

      {error && <p className="text-red-500 text-sm">{error.message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 bg-primary text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-pink-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Enregistrement...' : saved ? '✓ Enregistré !' : 'Enregistrer les horaires'}
      </button>
    </form>
  );
}
