import { userClient, call } from '../grpcClients';
import type { GraphQLContext } from '../context';
import { requireAuth, requireRole } from '../context';

interface GrpcUser {
  id: string; email: string; role: string; nom: string; prenom: string; avatar: string;
}
interface GrpcDashboard {
  rdv_aujourdhui: number; rdv_semaine: number; note_moyenne: number;
  total_clients: number; total_avis: number; revenus_mois: number;
}

function mapUser(u: GrpcUser) {
  return { id: u.id, email: u.email, role: u.role, nom: u.nom, prenom: u.prenom, avatar: u.avatar };
}

export const userResolvers = {
  Query: {
    async me(_: unknown, __: unknown, ctx: GraphQLContext) {
      if (!ctx.user) return null;
      const res = await call<unknown, { success: boolean; error: string; user: GrpcUser }>(
        userClient, 'GetUser', { id: ctx.user.id },
      );
      if (!res.success) return null;
      return mapUser(res.user);
    },

    async dashboardPro(_: unknown, __: unknown, ctx: GraphQLContext) {
      const user = requireRole(ctx, 'COIFFEUR');
      const res = await call<unknown, { success: boolean; error: string } & GrpcDashboard>(
        userClient, 'GetDashboardPro', { id: user.id },
      );
      if (!res.success) throw new Error(res.error);
      return {
        rdvAujourdhui: res.rdv_aujourdhui,
        rdvSemaine: res.rdv_semaine,
        noteMoyenne: res.note_moyenne,
        totalClients: res.total_clients,
        totalAvis: res.total_avis,
        revenusMois: res.revenus_mois,
      };
    },
  },

  Mutation: {
    async updateProfile(_: unknown, args: { nom?: string; prenom?: string; avatar?: string }, ctx: GraphQLContext) {
      const user = requireAuth(ctx);
      const res = await call<unknown, { success: boolean; error: string; user: GrpcUser }>(
        userClient, 'UpdateProfile',
        { id: user.id, nom: args.nom ?? '', prenom: args.prenom ?? '', avatar: args.avatar ?? '' },
      );
      if (!res.success) throw new Error(res.error);
      return mapUser(res.user);
    },
  },
};
