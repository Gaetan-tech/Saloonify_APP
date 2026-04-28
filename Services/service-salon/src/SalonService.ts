import prisma from './prismaClient';
import { EventBusService, EVENTS } from '@saloonify/event-bus';

type Callback = (err: null, response?: unknown) => void;

const ok = (data: Record<string, unknown>) => ({ success: true, error: '', ...data });
const fail = (msg: string) => ({ success: false, error: msg });

function mapSalon(salon: {
  id: string; nom: string; description: string; adresse: string;
  lat: number; lng: number; photos: string[]; note: number; totalAvis: number;
  coiffeurId: string;
  coiffeur?: { nom: string; prenom: string };
  prestations?: Array<{ id: string; nom: string; description: string | null; duree: number; prix: number; categorie: string; salonId: string }>;
  horaires?: Array<{ id: string; jour: string; ouvert: boolean; heureDebut: string | null; heureFin: string | null; salonId: string }>;
}, distance = 0) {
  return {
    id: salon.id,
    nom: salon.nom,
    description: salon.description,
    adresse: salon.adresse,
    lat: salon.lat,
    lng: salon.lng,
    photos: salon.photos,
    note: salon.note,
    total_avis: salon.totalAvis,
    coiffeur_id: salon.coiffeurId,
    coiffeur_nom: salon.coiffeur?.nom ?? '',
    coiffeur_prenom: salon.coiffeur?.prenom ?? '',
    prestations: (salon.prestations ?? []).map((p) => ({
      id: p.id, nom: p.nom, description: p.description ?? '',
      duree: p.duree, prix: p.prix, categorie: p.categorie, salon_id: p.salonId,
    })),
    horaires: (salon.horaires ?? []).map((h) => ({
      id: h.id, jour: h.jour, ouvert: h.ouvert,
      heure_debut: h.heureDebut ?? '', heure_fin: h.heureFin ?? '', salon_id: h.salonId,
    })),
    distance,
  };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const createSalonService = (eventBus: EventBusService) => ({
  async GetSalon(call: { request: { id: string } }, cb: Callback) {
    try {
      const salon = await prisma.salon.findUnique({
        where: { id: call.request.id },
        include: { coiffeur: true, prestations: true, horaires: true },
      });
      if (!salon) return cb(null, fail('Salon introuvable'));
      cb(null, ok({ salon: mapSalon(salon) }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async ListSalons(
    call: {
      request: {
        lat: number; lng: number; rayon: number;
        filtre_categorie: string; prix_max: number; note_min: number;
        limit: number; offset: number;
      };
    },
    cb: Callback,
  ) {
    try {
      const { lat, lng, rayon, filtre_categorie, prix_max, note_min, limit, offset } = call.request;

      // Push all non-geo filters to DB level; geo filter must stay in JS (no PostGIS)
      const andConditions: object[] = [];
      if (note_min > 0) andConditions.push({ note: { gte: note_min } });
      if (filtre_categorie) andConditions.push({ prestations: { some: { categorie: filtre_categorie } } });
      if (prix_max > 0) andConditions.push({ prestations: { some: { prix: { lte: prix_max } } } });

      const salons = await prisma.salon.findMany({
        include: { coiffeur: true, prestations: true, horaires: true },
        where: andConditions.length > 0 ? { AND: andConditions } : undefined,
      });

      // Geo filter in JS, then sort by distance
      let filtered = salons;
      if (lat && lng && rayon > 0) {
        filtered = salons.filter((s) => haversineKm(lat, lng, s.lat, s.lng) <= rayon);
      }

      const withDistance = filtered
        .map((s) => ({ ...s, distance: lat && lng ? haversineKm(lat, lng, s.lat, s.lng) : 0 }))
        .sort((a, b) => a.distance - b.distance);

      // Apply pagination after filtering so limit/offset are always correct
      const total = withDistance.length;
      const pageLimit = limit > 0 ? limit : 50;
      const paginated = withDistance.slice(offset ?? 0, (offset ?? 0) + pageLimit);

      cb(null, ok({ salons: paginated.map((s) => mapSalon(s, s.distance)), total }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async GetSalonsByCoiffeur(call: { request: { coiffeur_id: string } }, cb: Callback) {
    try {
      const salons = await prisma.salon.findMany({
        where: { coiffeurId: call.request.coiffeur_id },
        include: { coiffeur: true, prestations: true, horaires: true },
      });
      cb(null, ok({ salons: salons.map((s) => mapSalon(s)), total: salons.length }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async CreateSalon(
    call: { request: { nom: string; description: string; adresse: string; lat: number; lng: number; photos: string[]; coiffeur_id: string } },
    cb: Callback,
  ) {
    try {
      const existing = await prisma.salon.findUnique({ where: { coiffeurId: call.request.coiffeur_id } });
      if (existing) return cb(null, fail('Vous avez déjà une boutique'));
      const salon = await prisma.salon.create({
        data: {
          nom: call.request.nom,
          description: call.request.description,
          adresse: call.request.adresse,
          lat: call.request.lat,
          lng: call.request.lng,
          photos: call.request.photos,
          coiffeurId: call.request.coiffeur_id,
          horaires: {
            create: ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'].map((j) => ({
              jour: j, ouvert: true, heureDebut: '09:00', heureFin: '19:00',
            })),
          },
        },
        include: { coiffeur: true, prestations: true, horaires: true },
      });
      eventBus.publish(EVENTS.SALON_UPDATED, { salonId: salon.id }).catch(() => {});
      cb(null, ok({ salon: mapSalon(salon) }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async UpdateSalon(
    call: { request: { id: string; nom: string; description: string; adresse: string; lat: number; lng: number; photos: string[] } },
    cb: Callback,
  ) {
    try {
      const salon = await prisma.salon.update({
        where: { id: call.request.id },
        data: {
          nom: call.request.nom || undefined,
          description: call.request.description || undefined,
          adresse: call.request.adresse || undefined,
          lat: call.request.lat !== 0 ? call.request.lat : undefined,
          lng: call.request.lng !== 0 ? call.request.lng : undefined,
          photos: call.request.photos !== undefined ? call.request.photos : undefined,
        },
        include: { coiffeur: true, prestations: true, horaires: true },
      });
      eventBus.publish(EVENTS.SALON_UPDATED, { salonId: salon.id }).catch(() => {});
      cb(null, ok({ salon: mapSalon(salon) }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async DeleteSalon(call: { request: { id: string } }, cb: Callback) {
    try {
      await prisma.salon.delete({ where: { id: call.request.id } });
      cb(null, ok({}));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async CreatePrestation(
    call: { request: { nom: string; description: string; duree: number; prix: number; categorie: string; salon_id: string } },
    cb: Callback,
  ) {
    try {
      const p = await prisma.prestation.create({
        data: {
          nom: call.request.nom,
          description: call.request.description,
          duree: call.request.duree,
          prix: call.request.prix,
          categorie: call.request.categorie,
          salonId: call.request.salon_id,
        },
      });
      cb(null, ok({
        prestation: {
          id: p.id, nom: p.nom, description: p.description ?? '',
          duree: p.duree, prix: p.prix, categorie: p.categorie, salon_id: p.salonId,
        },
      }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async UpdatePrestation(
    call: { request: { id: string; nom: string; description: string; duree: number; prix: number; categorie: string } },
    cb: Callback,
  ) {
    try {
      const p = await prisma.prestation.update({
        where: { id: call.request.id },
        data: {
          nom: call.request.nom || undefined,
          description: call.request.description || undefined,
          duree: call.request.duree > 0 ? call.request.duree : undefined,
          prix: call.request.prix >= 0 ? call.request.prix : undefined,
          categorie: call.request.categorie || undefined,
        },
      });
      cb(null, ok({
        prestation: {
          id: p.id, nom: p.nom, description: p.description ?? '',
          duree: p.duree, prix: p.prix, categorie: p.categorie, salon_id: p.salonId,
        },
      }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async DeletePrestation(call: { request: { id: string } }, cb: Callback) {
    try {
      const bookingCount = await prisma.booking.count({
        where: { prestationId: call.request.id, statut: { notIn: ['ANNULE', 'TERMINE'] } },
      });
      if (bookingCount > 0) {
        return cb(null, fail(`Impossible de supprimer : ${bookingCount} réservation(s) active(s) sur cette prestation`));
      }
      await prisma.prestation.delete({ where: { id: call.request.id } });
      cb(null, ok({}));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async SetHoraires(
    call: {
      request: {
        salon_id: string;
        horaires: Array<{ jour: string; ouvert: boolean; heure_debut: string; heure_fin: string }>;
      };
    },
    cb: Callback,
  ) {
    try {
      await prisma.horaire.deleteMany({ where: { salonId: call.request.salon_id } });
      const created = await prisma.$transaction(
        call.request.horaires.map((h) =>
          prisma.horaire.create({
            data: {
              jour: h.jour,
              ouvert: h.ouvert,
              heureDebut: h.heure_debut || null,
              heureFin: h.heure_fin || null,
              salonId: call.request.salon_id,
            },
          }),
        ),
      );
      cb(null, ok({
        horaires: created.map((h) => ({
          id: h.id, jour: h.jour, ouvert: h.ouvert,
          heure_debut: h.heureDebut ?? '', heure_fin: h.heureFin ?? '', salon_id: h.salonId,
        })),
      }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },
});
