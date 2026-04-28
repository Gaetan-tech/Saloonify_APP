import cors from 'cors';

const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5174').split(',').map((o) => o.trim());
const isDev = process.env.NODE_ENV !== 'production';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (isDev && /^http:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origine non autorisée — ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['x-request-id'],
  optionsSuccessStatus: 200,
});
