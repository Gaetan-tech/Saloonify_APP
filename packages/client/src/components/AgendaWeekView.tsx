import type { Booking } from '../types';

interface AgendaWeekViewProps {
  bookings: Booking[];
  weekStart: Date;
  onBookingClick?: (booking: Booking) => void;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);
const JOURS_COURT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getWeekDays(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

const STATUS_COLORS: Record<string, string> = {
  EN_ATTENTE: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  CONFIRME: 'bg-green-100 border-green-300 text-green-800',
  ANNULE: 'bg-red-100 border-red-300 text-red-500 opacity-60',
  TERMINE: 'bg-gray-100 border-gray-300 text-gray-600',
};

export default function AgendaWeekView({ bookings, weekStart, onBookingClick }: AgendaWeekViewProps) {
  const days = getWeekDays(weekStart);

  function bookingsForDay(day: Date): Booking[] {
    return bookings.filter((b) => {
      const d = new Date(b.dateHeure);
      return d.toDateString() === day.toDateString();
    });
  }

  function getTopOffset(dateHeure: string): number {
    const d = new Date(dateHeure);
    const minutesFromStart = (d.getHours() - 8) * 60 + d.getMinutes();
    return (minutesFromStart / 60) * 56;
  }

  function getHeight(duree: number): number {
    return (duree / 60) * 56 - 4;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-8 border-b border-gray-100">
          <div className="h-10" />
          {days.map((day, i) => (
            <div key={i} className={`h-10 flex flex-col items-center justify-center text-xs border-l border-gray-100 ${day.toDateString() === new Date().toDateString() ? 'bg-accent' : ''}`}>
              <span className="font-semibold text-dark">{JOURS_COURT[i]}</span>
              <span className="text-gray-400">{day.getDate()}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-8">
          <div>
            {HOURS.map((h) => (
              <div key={h} className="h-14 flex items-start justify-center pt-1 text-xs text-gray-400 border-b border-gray-50">
                {h}:00
              </div>
            ))}
          </div>

          {days.map((day, di) => {
            const dayBookings = bookingsForDay(day);
            return (
              <div key={di} className={`relative border-l border-gray-100 ${day.toDateString() === new Date().toDateString() ? 'bg-accent/30' : ''}`}>
                {HOURS.map((h) => (
                  <div key={h} className="h-14 border-b border-gray-50" />
                ))}
                {dayBookings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onBookingClick?.(b)}
                    style={{ top: getTopOffset(b.dateHeure), height: Math.max(getHeight(b.prestationDuree), 24) }}
                    className={`absolute left-0.5 right-0.5 rounded-lg border text-left px-1.5 py-1 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ${STATUS_COLORS[b.statut] ?? 'bg-accent border-secondary text-primary'}`}
                  >
                    <p className="text-xs font-semibold truncate">{new Date(b.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-xs truncate">{b.clientPrenom} {b.clientNom}</p>
                    <p className="text-xs truncate opacity-75">{b.prestationNom}</p>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
