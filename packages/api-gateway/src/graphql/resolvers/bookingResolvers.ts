import { bookingClient, call } from '../grpcClients';
import type { GraphQLContext } from '../context';
import { requireAuth, requireRole } from '../context';

interface GrpcBooking {
  id: string; client_id: string; client_nom: string; client_prenom: string; client_email: string;
  salon_id: string; salon_nom: string; prestation_id: string; prestation_nom: string;
  prestation_duree: number; prestation_prix: number; coiffeur_id: string;
  date_heure: string; statut: string; created_at: string;
}
interface GrpcSlot { date_heure: string; disponible: boolean }

function mapBooking(b: GrpcBooking) {
  return {
    id: b.id, clientId: b.client_id, clientNom: b.client_nom, clientPrenom: b.client_prenom,
    clientEmail: b.client_email, salonId: b.salon_id, salonNom: b.salon_nom,
    prestationId: b.prestation_id, prestationNom: b.prestation_nom,
    prestationDuree: b.prestation_duree, prestationPrix: b.prestation_prix,
    coiffeurId: b.coiffeur_id, dateHeure: b.date_heure, statut: b.statut, createdAt: b.created_at,
  };
}

export const bookingResolvers = {
  Query: {
    async availableSlots(_: unknown, { salonId, prestationId, date }: { salonId: string; prestationId: string; date: string }) {
      const res = await call<unknown, { success: boolean; error: string; slots: GrpcSlot[] }>(
        bookingClient, 'GetAvailableSlots', { salon_id: salonId, prestation_id: prestationId, date },
      );
      if (!res.success) throw new Error(res.error);
      return res.slots.map((s) => ({ dateHeure: s.date_heure, disponible: s.disponible }));
    },

    async myBookings(_: unknown, __: unknown, ctx: GraphQLContext) {
      const user = requireAuth(ctx);
      const res = await call<unknown, { success: boolean; error: string; bookings: GrpcBooking[] }>(
        bookingClient, 'ListBookingsByClient', { user_id: user.id },
      );
      if (!res.success) throw new Error(res.error);
      return res.bookings.map(mapBooking);
    },

    async proBookings(_: unknown, { date }: { date?: string }, ctx: GraphQLContext) {
      const user = requireRole(ctx, 'COIFFEUR');
      const res = await call<unknown, { success: boolean; error: string; bookings: GrpcBooking[] }>(
        bookingClient, 'ListBookingsByPro', { pro_id: user.id, date: date ?? '' },
      );
      if (!res.success) throw new Error(res.error);
      return res.bookings.map(mapBooking);
    },
  },

  Mutation: {
    async createBooking(
      _: unknown,
      { salonId, prestationId, dateHeure }: { salonId: string; prestationId: string; dateHeure: string },
      ctx: GraphQLContext,
    ) {
      const user = requireAuth(ctx);
      const res = await call<unknown, { success: boolean; error: string; booking: GrpcBooking }>(
        bookingClient, 'CreateBooking',
        { client_id: user.id, salon_id: salonId, prestation_id: prestationId, date_heure: dateHeure },
      );
      if (!res.success) throw new Error(res.error);
      return mapBooking(res.booking);
    },

    async cancelBooking(_: unknown, { id }: { id: string }, ctx: GraphQLContext) {
      requireAuth(ctx);
      const res = await call<unknown, { success: boolean; error: string; booking: GrpcBooking }>(
        bookingClient, 'CancelBooking', { id },
      );
      if (!res.success) throw new Error(res.error);
      return mapBooking(res.booking);
    },

    async confirmBooking(_: unknown, { id }: { id: string }, ctx: GraphQLContext) {
      requireRole(ctx, 'COIFFEUR');
      const res = await call<unknown, { success: boolean; error: string; booking: GrpcBooking }>(
        bookingClient, 'ConfirmBooking', { id },
      );
      if (!res.success) throw new Error(res.error);
      return mapBooking(res.booking);
    },

    async terminateBooking(_: unknown, { id }: { id: string }, ctx: GraphQLContext) {
      requireRole(ctx, 'COIFFEUR');
      const res = await call<unknown, { success: boolean; error: string; booking: GrpcBooking }>(
        bookingClient, 'TerminateBooking', { id },
      );
      if (!res.success) throw new Error(res.error);
      return mapBooking(res.booking);
    },
  },
};
