import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { userClient, call } from '../graphql/grpcClients';

const JWT_SECRET = process.env.JWT_SECRET ?? 'secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'refresh_secret';
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

interface GrpcUser { id: string; email: string; role: string; nom: string; prenom: string; avatar: string }
interface GrpcUserRes { success: boolean; error: string; user: GrpcUser }

function issueTokens(user: GrpcUser) {
  const payload = { id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
  const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
  return { accessToken, refreshToken };
}

export const AuthController = {
  async register(req: Request, res: Response) {
    try {
      const { email, password, role, nom, prenom } = req.body as {
        email: string; password: string; role?: string; nom: string; prenom: string;
      };
      if (!email || !password || !nom || !prenom) {
        return res.status(400).json({ error: 'Champs requis manquants' });
      }
      const result = await call<unknown, GrpcUserRes>(userClient, 'CreateUser', {
        email, password, role: role ?? 'CLIENT', nom, prenom,
      });
      if (!result.success) return res.status(400).json({ error: result.error });

      const { accessToken, refreshToken } = issueTokens(result.user);
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', maxAge: COOKIE_MAX_AGE,
      });
      return res.status(201).json({
        accessToken,
        user: { id: result.user.id, email: result.user.email, role: result.user.role, nom: result.user.nom, prenom: result.user.prenom },
      });
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body as { email: string; password: string };
      if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

      const result = await call<unknown, GrpcUserRes>(userClient, 'VerifyCredentials', { email, password });
      if (!result.success) return res.status(401).json({ error: result.error });

      const { accessToken, refreshToken } = issueTokens(result.user);
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', maxAge: COOKIE_MAX_AGE,
      });
      return res.json({
        accessToken,
        user: { id: result.user.id, email: result.user.email, role: result.user.role, nom: result.user.nom, prenom: result.user.prenom },
      });
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  },

  async refresh(req: Request, res: Response) {
    try {
      const token = req.cookies?.refresh_token as string | undefined;
      if (!token) return res.status(401).json({ error: 'Refresh token manquant' });

      const payload = jwt.verify(token, JWT_REFRESH_SECRET) as { id: string };
      const result = await call<unknown, GrpcUserRes>(userClient, 'GetUser', { id: payload.id });
      if (!result.success) return res.status(401).json({ error: 'Utilisateur introuvable' });

      const { accessToken, refreshToken } = issueTokens(result.user);
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', maxAge: COOKIE_MAX_AGE,
      });
      return res.json({ accessToken });
    } catch {
      return res.status(401).json({ error: 'Refresh token invalide ou expiré' });
    }
  },

  logout(_req: Request, res: Response) {
    res.clearCookie('refresh_token');
    return res.json({ message: 'Déconnecté avec succès' });
  },
};
