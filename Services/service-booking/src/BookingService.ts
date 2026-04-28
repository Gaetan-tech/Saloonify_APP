import prisma from './prismaClient';
import { EventBusService, EVENTS } from '@saloonify/event-bus';

type Callback = (err: null, response?: unknown) => void;
const ok = (data: Record<string, unknown>) => ({ success: true, error: '', ...data });
const fail = (msg: string) => ({ success: false, error: msg });

function mapBooking(b: {
  id: string;
  clientId: string;
  client: { nom: string; prenom: string; email: string };
  salonId: string;
  salon: { nom: string; coiffeurId: string };
  prestationId: string;
  prestation: { nom: string; duree: number; prix: number };
  dateHeure: Date;
  statut: string;
  createdAt: Date;
}) {
  return {
    id: b.id,
    client_id: b.clientId,
    client_nom: b.client.nom,
    client_prenom: b.client.prenom,
    client_email: b.client.email,
    salon_id: b.salonId,
    salon_nom: b.salon.nom,
    prestation_id: b.prestationId,
    prestation_nom: b.prestation.nom,
    prestation_duree: b.prestation.duree,
    prestation_prix: b.prestation.prix,
    coiffeur_id: b.salon.coiffeurId,
    date_heure: b.dateHeure.toISOString(),
    statut: b.statut,
    created_at: b.createdAt.toISOString(),
  };
}

const bookingInclude = {
  client: true,
  salon: true,
  prestation: true,
} as const;

export const createBookingService = (eventBus: EventBusService) => ({
  async CreateBooking(
    call: { request: { client_id: string; salon_id: string; prestation_id: string; date_heure: string } },
    cb: Callback,
  ) {
    try {
      const { client_id, salon_id, prestation_id, date_heure } = call.request;
      const dateHeure = new Date(date_heure);

      const prestation = await prisma.prestation.findUnique({ where: { id: prestation_id } });
      if (!prestation) return cb(null, fail('Prestation introuvable'));

      const endTime = new Date(dateHeure.getTime() + prestation.duree * 60000);

      // Fetch all non-cancelled bookings that start before our new booking ends
      const potentialConflicts = await prisma.booking.findMany({
        where: {
          salonId: salon_id,
          statut: { not: 'ANNULE' },
          dateHeure: { lt: endTime },
        },
        include: { prestation: true },
      });

      // A true overlap requires: existing.end > newStart (existing ends after new starts)
      const hasConflict = potentialConflicts.some((b) => {
        const existingEnd = new Date(b.dateHeure.getTime() + b.prestation.duree * 60000);
        return existingEnd > dateHeure;
      });

      if (hasConflict) return cb(null, fail('Ce créneau n\'est plus disponible'));

      const booking = await prisma.booking.create({
        data: { clientId: client_id, salonId: salon_id, prestationId: prestation_id, dateHeure, statut: 'EN_ATTENTE' },
        include: bookingInclude,
      });

      eventBus.publish(EVENTS.BOOKING_CREATED, {
        bookingId: booking.id,
        clientEmail: booking.client.email,
        clientNom: booking.client.nom,
        salonNom: booking.salon.nom,
        dateHeure: booking.dateHeure.toISOString(),
        prestationNom: booking.prestation.nom,
      }).catch(() => {});

      cb(null, ok({ booking: mapBooking(booking) }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async CancelBooking(call: { request: { id: string } }, cb: Callback) {
    try {
      const booking = await prisma.booking.update({
        where: { id: call.request.id },
        data: { statut: 'ANNULE' },
        include: bookingInclude,
      });
      eventBus.publish(EVENTS.BOOKING_CANCELLED, {
        bookingId: booking.id,
        clientEmail: booking.client.email,
        salonNom: booking.salon.nom,
        dateHeure: booking.dateHeure.toISOString(),
      }).catch(() => {});
      cb(null, ok({ booking: mapBooking(booking) }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async ConfirmBooking(call: { request: { id: string } }, cb: Callback) {
    try {
      const booking = await prisma.booking.update({
        where: { id: call.request.id },
        data: { statut: 'CONFIRME' },
        include: bookingInclude,
      });
      eventBus.publish(EVENTS.BOOKING_CONFIRMED, {
        bookingId: booking.id,
        clientEmail: booking.client.email,
        salonNom: booking.salon.nom,
        dateHeure: booking.dateHeure.toISOString(),
      }).catch(() => {});
      cb(null, ok({ booking: mapBooking(booking) }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async TerminateBooking(call: { request: { id: string } }, cb: Callback) {
    try {
      const booking = await prisma.booking.update({
        where: { id: call.request.id },
        data: { statut: 'TERMINE' },
        include: bookingInclude,
      });
      eventBus.publish(EVENTS.BOOKING_TERMINATED, { bookingId: booking.id }).catch(() => {});
      cb(null, ok({ booking: mapBooking(booking) }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async GetBooking(call: { request: { id: string } }, cb: Callback) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: call.request.id },
        include: bookingInclude,
      });
      if (!booking) return cb(null, fail('Réservation introuvable'));
      cb(null, ok({ booking: mapBooking(booking) }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async GetAvailableSlots(
    call: { request: { salon_id: string; prestation_id: string; date: string } },
    cb: Callback,
  ) {
    try {
      const { salon_id, prestation_id, date } = call.request;
      const targetDate = new Date(date);
      const dayNames = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
      const jourSemaine = dayNames[targetDate.getDay()];

      const horaire = await prisma.horaire.findFirst({ where: { salonId: salon_id, jour: jourSemaine } });

      if (!horaire || !horaire.ouvert || !horaire.heureDebut || !horaire.heureFin) {
        return cb(null, ok({ slots: [] }));
      }

      const prestation = await prisma.prestation.findUnique({ where: { id: prestation_id } });
      if (!prestation) return cb(null, fail('Prestation introuvable'));

      const [startH, startM] = horaire.heureDebut.split(':').map(Number);
      const [endH, endM] = horaire.heureFin.split(':').map(Number);
      const openMinutes = startH * 60 + startM;
      const closeMinutes = endH * 60 + endM;

      const existingBookings = await prisma.booking.findMany({
        where: {
          salonId: salon_id,
          statut: { not: 'ANNULE' },
          dateHeure: {
            gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0),
            lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59),
          },
        },
        include: { prestation: true },
      });

      const slots = [];
      const INTERVAL = 30;

      for (let m = openMinutes; m + prestation.duree <= closeMinutes; m += INTERVAL) {
        const slotDate = new Date(targetDate);
        slotDate.setHours(Math.floor(m / 60), m % 60, 0, 0);
        const slotEnd = new Date(slotDate.getTime() + prestation.duree * 60000);

        const isOccupied = existingBookings.some((b) => {
          const bEnd = new Date(b.dateHeure.getTime() + b.prestation.duree * 60000);
          return slotDate < bEnd && slotEnd > b.dateHeure;
        });

        slots.push({ date_heure: slotDate.toISOString(), disponible: !isOccupied && slotDate > new Date() });
      }

      cb(null, ok({ slots }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async ListBookingsByClient(call: { request: { user_id: string } }, cb: Callback) {
    try {
      const bookings = await prisma.booking.findMany({
        where: { clientId: call.request.user_id },
        include: bookingInclude,
        orderBy: { dateHeure: 'desc' },
      });
      cb(null, ok({ bookings: bookings.map(mapBooking) }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async ListBookingsByPro(call: { request: { pro_id: string; date: string } }, cb: Callback) {
    try {
      const salon = await prisma.salon.findUnique({ where: { coiffeurId: call.request.pro_id } });
      if (!salon) return cb(null, ok({ bookings: [] }));

      const where: { salonId: string; dateHeure?: { gte: Date; lt: Date } } = { salonId: salon.id };

      if (call.request.date) {
        const d = new Date(call.request.date);
        where.dateHeure = {
          gte: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
          lt: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
        };
      }

      const bookings = await prisma.booking.findMany({ where, include: bookingInclude, orderBy: { dateHeure: 'asc' } });
      cb(null, ok({ bookings: bookings.map(mapBooking) }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },
});
