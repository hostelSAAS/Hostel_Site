import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import mongoose from 'mongoose';
import { env, origins } from './config/env.js';
import { router } from './routes/index.js';
import { errorHandler, HttpError, originGuard } from './middleware/http.js';

export function createApp({ ensureDatabase } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);
  app.use(helmet());
  app.use(cors({ origin: (origin, callback) => callback(null, !origin || origins.includes(origin)), credentials: true }));
  app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use('/api', rateLimit({ windowMs: 60000, limit: 180, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: { message: 'Too many requests' } } }));
  if (ensureDatabase) app.use(async (req, res, next) => {
    try { await ensureDatabase(); next(); } catch (error) { next(error); }
  });
  app.use(originGuard, express.json({ limit: '100kb' }), cookieParser());
  app.get('/api/health', (req, res) => res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({ data: { status: mongoose.connection.readyState === 1 ? 'ok' : 'unavailable' } }));
  app.use('/api', router);
  app.use((req, res, next) => next(new HttpError(404, 'Route not found')));
  app.use(errorHandler);
  return app;
}
