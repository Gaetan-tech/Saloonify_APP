import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { AuthController } from '../controllers/AuthController';
import { authLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/auth';

const router = Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './public/uploads';

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Seules les images sont acceptées'));
    }
    cb(null, true);
  },
});

router.post('/auth/register', authLimiter, AuthController.register);
router.post('/auth/login', authLimiter, AuthController.login);
router.post('/auth/refresh', AuthController.refresh);
router.post('/auth/logout', AuthController.logout);

router.post(
  '/api/upload',
  requireAuth,
  upload.array('photos', 10),
  (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) return res.status(400).json({ error: 'Aucun fichier reçu' });
    const urls = files.map((f) => `/uploads/${f.filename}`);
    return res.json({ urls });
  },
);

router.get('/api/geo/search', async (req: Request, res: Response) => {
  try {
    const { q, lat, lon, limit = '5' } = req.query as Record<string, string>;
    const params: Record<string, string> = { format: 'json', limit, addressdetails: '1' };
    if (q) params['q'] = q;
    if (lat && lon) { params['lat'] = lat; params['lon'] = lon; }

    const endpoint = lat && lon
      ? 'https://nominatim.openstreetmap.org/reverse'
      : 'https://nominatim.openstreetmap.org/search';

    const { data } = await axios.get(endpoint, {
      params,
      headers: { 'User-Agent': 'Saloonify/1.0 contact@saloonify.fr' },
    });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Erreur géolocalisation' });
  }
});

export default router;
