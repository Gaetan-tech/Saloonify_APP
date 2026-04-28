import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_AVAILABLE_SLOTS } from '../graphql/queries';
import type { TimeSlot } from '../types';

interface BookingCalendarProps {
  salonId: string;
  prestationId: string;
  onSlotSelect: (dateHeure: string) => void;
  selectedSlot?: string;
}

const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

function getNext14Days(): Date[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });
}

function formatDateLabel(d: Date): string {
  return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`;
}

export default function BookingCalendar({ salonId, prestationId, onSlotSelect, selectedSlot }: BookingCalendarProps) {
  const days = getNext14Days();
  const [selectedDay, setSelectedDay] = useState<Date>(days[0]);

  const dateStr = `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, '0')}-${String(selectedDay.getDate()).padStart(2, '0')}`;

  const { data, loading } = useQuery<{ availableSlots: TimeSlot[] }>(GET_AVAILABLE_SLOTS, {
    variables: { salonId, prestationId, date: dateStr },
    skip: !prestationId,
  });

  const slots = data?.availableSlots ?? [];
  const available = slots.filter((s) => s.disponible);

  function formatTime(iso: string): string {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {days.map((day) => {
            const active = day.toDateString() === selectedDay.toDateString();
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  active ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-accent hover:text-primary'
                }`}
              >
                {formatDateLabel(day)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : available.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-2xl mb-2">📅</p>
            <p className="text-sm">Aucun créneau disponible ce jour-là.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {available.map((slot) => {
              const active = selectedSlot === slot.dateHeure;
              return (
                <button
                  key={slot.dateHeure}
                  onClick={() => onSlotSelect(slot.dateHeure)}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    active ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-accent hover:text-primary border border-gray-100 hover:border-secondary'
                  }`}
                >
                  {formatTime(slot.dateHeure)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
