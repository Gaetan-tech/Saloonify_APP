import prisma from './prismaClient';
import { EventBusService, EVENTS } from '@saloonify/event-bus';

type Callback = (err: null, response?: unknown) => void;
const ok = (data: Record<string, unknown>) => ({ success: true, error: '', ...data });
const fail = (msg: string) => ({ success: false, error: msg });

async function recalculateSalonRating(salonId: string) {
  const agg = await prisma.review.aggregate({
    where: { salonId },
    _avg: { note: true },
    _count: { note: true },
  });
  const noteMoyenne = agg._avg.note ?? 0;
  const totalAvis = agg._count.note;
  await prisma.salon.update({
    where: { id: salonId },
    data: { note: Math.round(noteMoyenne * 10) / 10, totalAvis },
  });
  return { noteMoyenne, totalAvis };
}

export const createReviewService = (eventBus: EventBusService) => ({
  async AddReview(
    call: { request: { client_id: string; salon_id: string; note: number; commentaire: string } },
    cb: Callback,
  ) {
    try {
      const { client_id, salon_id, note, commentaire } = call.request;

      if (note < 1 || note > 5) return cb(null, fail('La note doit être entre 1 et 5'));

      const alreadyReviewed = await prisma.review.findFirst({ where: { clientId: client_id, salonId: salon_id } });
      if (alreadyReviewed) return cb(null, fail('Vous avez déjà laissé un avis pour ce salon'));

      const review = await prisma.review.create({
        data: { note, commentaire, clientId: client_id, salonId: salon_id },
        include: { client: true },
      });

      // mise à jour synchrone de la note du salon via appel interne
      await recalculateSalonRating(salon_id);

      eventBus.publish(EVENTS.REVIEW_ADDED, { reviewId: review.id, salonId: salon_id }).catch(() => {});

      cb(null, ok({
        review: {
          id: review.id,
          client_id: review.clientId,
          client_nom: review.client.nom,
          client_prenom: review.client.prenom,
          client_avatar: review.client.avatar ?? '',
          salon_id: review.salonId,
          note: review.note,
          commentaire: review.commentaire ?? '',
          created_at: review.createdAt.toISOString(),
        },
      }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async GetReviews(
    call: { request: { salon_id: string; limit: number; offset: number } },
    cb: Callback,
  ) {
    try {
      const { salon_id, limit, offset } = call.request;
      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { salonId: salon_id },
          include: { client: true },
          orderBy: { createdAt: 'desc' },
          take: limit > 0 ? limit : 50,
          skip: offset ?? 0,
        }),
        prisma.review.count({ where: { salonId: salon_id } }),
      ]);

      const salon = await prisma.salon.findUnique({ where: { id: salon_id } });

      cb(null, ok({
        reviews: reviews.map((r) => ({
          id: r.id,
          client_id: r.clientId,
          client_nom: r.client.nom,
          client_prenom: r.client.prenom,
          client_avatar: r.client.avatar ?? '',
          salon_id: r.salonId,
          note: r.note,
          commentaire: r.commentaire ?? '',
          created_at: r.createdAt.toISOString(),
        })),
        note_moyenne: salon?.note ?? 0,
        total,
      }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async UpdateSalonRating(call: { request: { salon_id: string } }, cb: Callback) {
    try {
      const { noteMoyenne, totalAvis } = await recalculateSalonRating(call.request.salon_id);
      cb(null, ok({ note_moyenne: noteMoyenne, total_avis: totalAvis }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },
});
