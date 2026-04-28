import { salonClient, call } from '../grpcClients';
import type { GraphQLContext } from '../context';
import { requireRole } from '../context';

interface GrpcSalon {
  id: string; nom: string; description: string; adresse: string;
  lat: number; lng: number; photos: string[]; note: number; total_avis: number;
  coiffeur_id: string; coiffeur_nom: string; coiffeur_prenom: string;
  prestations: GrpcPrestation[]; horaires: GrpcHoraire[]; distance: number;
}
interface GrpcPrestation {
  id: string; nom: string; description: string; duree: number; prix: number;
  categorie: string; salon_id: string;
}
interface GrpcHoraire {
  id: string; jour: string; ouvert: boolean; heure_debut: string; heure_fin: string; salon_id: string;
}

function mapSalon(s: GrpcSalon) {
  return {
    id: s.id, nom: s.nom, description: s.description, adresse: s.adresse,
    lat: s.lat, lng: s.lng, photos: s.photos, note: s.note, totalAvis: s.total_avis,
    coiffeurId: s.coiffeur_id, coiffeurNom: s.coiffeur_nom, coiffeurPrenom: s.coiffeur_prenom,
    prestations: (s.prestations ?? []).map(mapPrestation),
    horaires: (s.horaires ?? []).map(mapHoraire),
    distance: s.distance,
  };
}
function mapPrestation(p: GrpcPrestation) {
  return { id: p.id, nom: p.nom, description: p.description, duree: p.duree, prix: p.prix, categorie: p.categorie, salonId: p.salon_id };
}
function mapHoraire(h: GrpcHoraire) {
  return { id: h.id, jour: h.jour, ouvert: h.ouvert, heureDebut: h.heure_debut, heureFin: h.heure_fin, salonId: h.salon_id };
}

export const salonResolvers = {
  Query: {
    async salons(
      _: unknown,
      { filter }: { filter?: { lat?: number; lng?: number; rayon?: number; categorie?: string; prixMax?: number; noteMin?: number; limit?: number; offset?: number } },
    ) {
      const res = await call<unknown, { success: boolean; error: string; salons: GrpcSalon[]; total: number }>(
        salonClient, 'ListSalons', {
          lat: filter?.lat ?? 0, lng: filter?.lng ?? 0,
          rayon: filter?.rayon ?? 0, filtre_categorie: filter?.categorie ?? '',
          prix_max: filter?.prixMax ?? 0, note_min: filter?.noteMin ?? 0,
          limit: filter?.limit ?? 20, offset: filter?.offset ?? 0,
        },
      );
      if (!res.success) throw new Error(res.error);
      return { salons: res.salons.map(mapSalon), total: res.total };
    },

    async salon(_: unknown, { id }: { id: string }) {
      const res = await call<unknown, { success: boolean; error: string; salon: GrpcSalon }>(
        salonClient, 'GetSalon', { id },
      );
      if (!res.success) throw new Error(res.error);
      return mapSalon(res.salon);
    },

    async salonsByCoiffeur(_: unknown, __: unknown, ctx: GraphQLContext) {
      const user = requireRole(ctx, 'COIFFEUR');
      const res = await call<unknown, { success: boolean; error: string; salons: GrpcSalon[] }>(
        salonClient, 'GetSalonsByCoiffeur', { coiffeur_id: user.id },
      );
      if (!res.success) throw new Error(res.error);
      return res.salons.map(mapSalon);
    },

    async mySalon(_: unknown, __: unknown, ctx: GraphQLContext) {
      const user = requireRole(ctx, 'COIFFEUR');
      const res = await call<unknown, { success: boolean; error: string; salons: GrpcSalon[] }>(
        salonClient, 'GetSalonsByCoiffeur', { coiffeur_id: user.id },
      );
      if (!res.success || !res.salons.length) return null;
      return mapSalon(res.salons[0]);
    },
  },

  Mutation: {
    async createSalon(
      _: unknown,
      { input }: { input: { nom: string; description: string; adresse: string; lat: number; lng: number; photos: string[] } },
      ctx: GraphQLContext,
    ) {
      const user = requireRole(ctx, 'COIFFEUR');
      const res = await call<unknown, { success: boolean; error: string; salon: GrpcSalon }>(
        salonClient, 'CreateSalon',
        { nom: input.nom, description: input.description, adresse: input.adresse, lat: input.lat, lng: input.lng, photos: input.photos ?? [], coiffeur_id: user.id },
      );
      if (!res.success) throw new Error(res.error);
      return mapSalon(res.salon);
    },

    async updateSalon(
      _: unknown,
      { id, input }: { id: string; input: { nom?: string; description?: string; adresse?: string; lat?: number; lng?: number; photos?: string[] } },
      ctx: GraphQLContext,
    ) {
      requireRole(ctx, 'COIFFEUR');
      const res = await call<unknown, { success: boolean; error: string; salon: GrpcSalon }>(
        salonClient, 'UpdateSalon', { id, ...input },
      );
      if (!res.success) throw new Error(res.error);
      return mapSalon(res.salon);
    },

    async createPrestation(
      _: unknown,
      { salonId, input }: { salonId: string; input: { nom: string; description?: string; duree: number; prix: number; categorie: string } },
      ctx: GraphQLContext,
    ) {
      requireRole(ctx, 'COIFFEUR');
      const res = await call<unknown, { success: boolean; error: string; prestation: GrpcPrestation }>(
        salonClient, 'CreatePrestation', { ...input, salon_id: salonId },
      );
      if (!res.success) throw new Error(res.error);
      return mapPrestation(res.prestation);
    },

    async updatePrestation(
      _: unknown,
      { id, input }: { id: string; input: { nom?: string; description?: string; duree?: number; prix?: number; categorie?: string } },
      ctx: GraphQLContext,
    ) {
      requireRole(ctx, 'COIFFEUR');
      const res = await call<unknown, { success: boolean; error: string; prestation: GrpcPrestation }>(
        salonClient, 'UpdatePrestation', { id, ...input },
      );
      if (!res.success) throw new Error(res.error);
      return mapPrestation(res.prestation);
    },

    async deletePrestation(_: unknown, { id }: { id: string }, ctx: GraphQLContext) {
      requireRole(ctx, 'COIFFEUR');
      const res = await call<unknown, { success: boolean; error: string }>(
        salonClient, 'DeletePrestation', { id },
      );
      if (!res.success) throw new Error(res.error);
      return true;
    },

    async setHoraires(
      _: unknown,
      { salonId, horaires }: { salonId: string; horaires: Array<{ jour: string; ouvert: boolean; heureDebut?: string; heureFin?: string }> },
      ctx: GraphQLContext,
    ) {
      requireRole(ctx, 'COIFFEUR');
      const res = await call<unknown, { success: boolean; error: string; horaires: GrpcHoraire[] }>(
        salonClient, 'SetHoraires',
        { salon_id: salonId, horaires: horaires.map((h) => ({ jour: h.jour, ouvert: h.ouvert, heure_debut: h.heureDebut ?? '', heure_fin: h.heureFin ?? '' })) },
      );
      if (!res.success) throw new Error(res.error);
      return res.horaires.map(mapHoraire);
    },
  },
};
