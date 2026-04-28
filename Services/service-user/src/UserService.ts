import * as grpc from '@grpc/grpc-js';
import bcrypt from 'bcryptjs';
import prisma from './prismaClient';

type Callback = (err: grpc.ServiceError | null, response?: unknown) => void;

const ok = (data: Record<string, unknown>) => ({ success: true, error: '', ...data });
const fail = (msg: string) => ({ success: false, error: msg });

export const UserService = {
  async GetUser(call: { request: { id: string } }, cb: Callback) {
    try {
      const user = await prisma.user.findUnique({ where: { id: call.request.id } });
      if (!user) return cb(null, fail('Utilisateur introuvable'));
      cb(null, ok({
        user: {
          id: user.id, email: user.email, role: user.role,
          nom: user.nom, prenom: user.prenom, avatar: user.avatar ?? '',
          created_at: user.createdAt.toISOString(),
        },
      }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async GetUserByEmail(call: { request: { email: string } }, cb: Callback) {
    try {
      const user = await prisma.user.findUnique({ where: { email: call.request.email } });
      if (!user) return cb(null, fail('Utilisateur introuvable'));
      cb(null, ok({
        user: {
          id: user.id, email: user.email, role: user.role,
          nom: user.nom, prenom: user.prenom, avatar: user.avatar ?? '',
          created_at: user.createdAt.toISOString(),
        },
      }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async CreateUser(
    call: { request: { email: string; password: string; role: string; nom: string; prenom: string } },
    cb: Callback,
  ) {
    try {
      const exists = await prisma.user.findUnique({ where: { email: call.request.email } });
      if (exists) return cb(null, fail('Email déjà utilisé'));
      const hash = await bcrypt.hash(call.request.password, 12);
      const user = await prisma.user.create({
        data: {
          email: call.request.email,
          password: hash,
          role: (call.request.role as 'CLIENT' | 'COIFFEUR' | 'ADMIN') ?? 'CLIENT',
          nom: call.request.nom,
          prenom: call.request.prenom,
        },
      });
      cb(null, ok({
        user: {
          id: user.id, email: user.email, role: user.role,
          nom: user.nom, prenom: user.prenom, avatar: user.avatar ?? '',
          created_at: user.createdAt.toISOString(),
        },
      }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async VerifyCredentials(call: { request: { email: string; password: string } }, cb: Callback) {
    try {
      const user = await prisma.user.findUnique({ where: { email: call.request.email } });
      if (!user) return cb(null, fail('Email ou mot de passe incorrect'));
      const valid = await bcrypt.compare(call.request.password, user.password);
      if (!valid) return cb(null, fail('Email ou mot de passe incorrect'));
      cb(null, ok({
        user: {
          id: user.id, email: user.email, role: user.role,
          nom: user.nom, prenom: user.prenom, avatar: user.avatar ?? '',
          created_at: user.createdAt.toISOString(),
        },
      }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async UpdateProfile(
    call: { request: { id: string; nom: string; prenom: string; avatar: string } },
    cb: Callback,
  ) {
    try {
      const user = await prisma.user.update({
        where: { id: call.request.id },
        data: {
          nom: call.request.nom || undefined,
          prenom: call.request.prenom || undefined,
          avatar: call.request.avatar || undefined,
        },
      });
      cb(null, ok({
        user: {
          id: user.id, email: user.email, role: user.role,
          nom: user.nom, prenom: user.prenom, avatar: user.avatar ?? '',
          created_at: user.createdAt.toISOString(),
        },
      }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },

  async GetDashboardPro(call: { request: { id: string } }, cb: Callback) {
    try {
      const salon = await prisma.salon.findUnique({ where: { coiffeurId: call.request.id } });
      if (!salon) {
        return cb(null, ok({
          rdv_aujourdhui: 0, rdv_semaine: 0, note_moyenne: 0,
          total_clients: 0, total_avis: 0, revenus_mois: 0,
        }));
      }

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 86400000);
      const startOfWeek = new Date(startOfDay.getTime() - startOfDay.getDay() * 86400000);
      const endOfWeek = new Date(startOfWeek.getTime() + 7 * 86400000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [rdvAujourdhui, rdvSemaine, rdvMois, clientsUniques] = await Promise.all([
        prisma.booking.count({
          where: { salonId: salon.id, dateHeure: { gte: startOfDay, lt: endOfDay }, statut: { not: 'ANNULE' } },
        }),
        prisma.booking.count({
          where: { salonId: salon.id, dateHeure: { gte: startOfWeek, lt: endOfWeek }, statut: { not: 'ANNULE' } },
        }),
        prisma.booking.findMany({
          where: { salonId: salon.id, dateHeure: { gte: startOfMonth }, statut: { not: 'ANNULE' } },
          include: { prestation: true },
        }),
        prisma.booking.findMany({
          where: { salonId: salon.id, statut: { not: 'ANNULE' } },
          select: { clientId: true },
          distinct: ['clientId'],
        }),
      ]);

      const revenus = rdvMois.reduce((sum, b) => sum + b.prestation.prix, 0);

      cb(null, ok({
        rdv_aujourdhui: rdvAujourdhui,
        rdv_semaine: rdvSemaine,
        note_moyenne: salon.note,
        total_clients: clientsUniques.length,
        total_avis: salon.totalAvis,
        revenus_mois: revenus,
      }));
    } catch (e) {
      cb(null, fail(String(e)));
    }
  },
};
