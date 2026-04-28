import { Request } from 'express';
import type { JwtPayload } from '../middleware/auth';

export type AuthUser = JwtPayload;

export interface GraphQLContext {
  user: AuthUser | null;
}

export function buildContext({ req }: { req: Request }): GraphQLContext {
  return { user: req.user ?? null };
}

export function requireAuth(ctx: GraphQLContext): AuthUser {
  if (!ctx.user) throw new Error('Authentification requise');
  return ctx.user;
}

export function requireRole(ctx: GraphQLContext, role: string): AuthUser {
  const user = requireAuth(ctx);
  if (user.role !== role && user.role !== 'ADMIN') {
    throw new Error(`Accès réservé aux ${role.toLowerCase()}s`);
  }
  return user;
}
