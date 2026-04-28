import { reviewClient, call } from '../grpcClients';
import type { GraphQLContext } from '../context';
import { requireAuth } from '../context';

interface GrpcReview {
  id: string; client_id: string; client_nom: string; client_prenom: string; client_avatar: string;
  salon_id: string; note: number; commentaire: string; created_at: string;
}

function mapReview(r: GrpcReview) {
  return {
    id: r.id, clientId: r.client_id, clientNom: r.client_nom, clientPrenom: r.client_prenom,
    clientAvatar: r.client_avatar, salonId: r.salon_id, note: r.note,
    commentaire: r.commentaire, createdAt: r.created_at,
  };
}

export const reviewResolvers = {
  Query: {
    async reviews(_: unknown, { salonId, limit, offset }: { salonId: string; limit?: number; offset?: number }) {
      const res = await call<unknown, { success: boolean; error: string; reviews: GrpcReview[]; note_moyenne: number; total: number }>(
        reviewClient, 'GetReviews', { salon_id: salonId, limit: limit ?? 20, offset: offset ?? 0 },
      );
      if (!res.success) throw new Error(res.error);
      return { reviews: res.reviews.map(mapReview), noteMoyenne: res.note_moyenne, total: res.total };
    },
  },

  Mutation: {
    async addReview(
      _: unknown,
      { salonId, note, commentaire }: { salonId: string; note: number; commentaire?: string },
      ctx: GraphQLContext,
    ) {
      const user = requireAuth(ctx);
      const res = await call<unknown, { success: boolean; error: string; review: GrpcReview }>(
        reviewClient, 'AddReview',
        { client_id: user.id, salon_id: salonId, note, commentaire: commentaire ?? '' },
      );
      if (!res.success) throw new Error(res.error);
      return mapReview(res.review);
    },
  },
};
